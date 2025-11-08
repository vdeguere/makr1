import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';
import { SendRecommendationDialog } from './SendRecommendationDialog';
import { recommendationSchema, herbItemSchema } from '@/lib/validations/recommendation';
import { z } from 'zod';
import { useAnalytics } from '@/hooks/useAnalytics';
interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  line_user_id: string | null;
}
interface Herb {
  id: string;
  name: string;
  thai_name: string | null;
  retail_price: number | null;
  stock_quantity: number;
}
interface HerbItem {
  herb_id: string;
  quantity: number;
  dosage_instructions: string;
  herb?: Herb;
}
interface RecommendationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultPatientId?: string;
  recommendation?: any;
}
export function RecommendationFormDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultPatientId,
  recommendation
}: RecommendationFormDialogProps) {
  const {
    user
  } = useAuth();
  const {
    activeRole
  } = useRole();
  const {
    toast
  } = useToast();
  const { trackEvent, trackException } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [practitioners, setPractitioners] = useState<{
    id: string;
    full_name: string;
  }[]>([]);
  const [createdRecommendationId, setCreatedRecommendationId] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    practitioner_id: '',
    patient_id: '',
    title: '',
    diagnosis: '',
    instructions: '',
    duration_days: ''
  });
  const [herbItems, setHerbItems] = useState<HerbItem[]>([]);
  useEffect(() => {
    if (open && user) {
      fetchPatients();
      fetchHerbs();
      if (activeRole === 'admin') {
        fetchPractitioners();
      }

      // Load existing recommendation data if editing
      if (recommendation) {
        setFormData({
          practitioner_id: recommendation.practitioner_id || '',
          patient_id: recommendation.patient_id || '',
          title: recommendation.title || '',
          diagnosis: recommendation.diagnosis || '',
          instructions: recommendation.instructions || '',
          duration_days: recommendation.duration_days?.toString() || ''
        });

        // Load recommendation items
        if (recommendation.recommendation_items) {
          const items = recommendation.recommendation_items.map((item: any) => ({
            herb_id: item.herb_id,
            quantity: item.quantity || 1,
            dosage_instructions: item.dosage_instructions || '',
            herb: item.herbs
          }));
          setHerbItems(items);
        }
      } else {
        // Pre-fill patient if defaultPatientId is provided (new recommendation)
        if (defaultPatientId) {
          setFormData(prev => ({
            ...prev,
            patient_id: defaultPatientId
          }));
        }
      }
    }
  }, [open, user, activeRole, defaultPatientId, recommendation]);
  const fetchPatients = async () => {
    let query = supabase.from('patients').select('id, full_name, email, line_user_id, practitioner_id');

    // Only filter by practitioner for non-admins
    if (activeRole !== 'admin' && user?.id) {
      query = query.eq('practitioner_id', user.id);
    }
    const {
      data,
      error
    } = await query.order('full_name');
    if (!error) setPatients(data || []);
  };
  const fetchPractitioners = async () => {
    const {
      data: roleData,
      error: roleError
    } = await supabase.from('user_roles').select('user_id').eq('role', 'practitioner');
    if (roleError || !roleData) return;
    const practitionerIds = roleData.map(r => r.user_id);
    const {
      data,
      error
    } = await supabase.from('profiles').select('id, full_name').in('id', practitionerIds).order('full_name');
    if (!error) setPractitioners(data || []);
  };
  const fetchHerbs = async () => {
    const {
      data,
      error
    } = await supabase.from('herbs').select('id, name, thai_name, retail_price, stock_quantity').gt('stock_quantity', 0).order('name');
    if (!error) setHerbs(data || []);
  };
  const addHerbItem = () => {
    setHerbItems([...herbItems, {
      herb_id: '',
      quantity: 1,
      dosage_instructions: ''
    }]);
  };
  const removeHerbItem = (index: number) => {
    setHerbItems(herbItems.filter((_, i) => i !== index));
  };
  const updateHerbItem = (index: number, field: keyof HerbItem, value: any) => {
    const updated = [...herbItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    if (field === 'herb_id') {
      const herb = herbs.find(h => h.id === value);
      updated[index].herb = herb;
    }
    setHerbItems(updated);
  };
  const calculateTotal = () => {
    return herbItems.reduce((total, item) => {
      const herb = herbs.find(h => h.id === item.herb_id);
      return total + (herb?.retail_price || 0) * item.quantity;
    }, 0);
  };
  const handleSubmit = async (sendImmediately: boolean = false) => {
    // Determine the practitioner_id to use
    const practitionerId = activeRole === 'admin' ? formData.practitioner_id : user?.id;
    if (!practitionerId || !formData.patient_id || !formData.title || herbItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: activeRole === 'admin' ? 'Please select a practitioner, patient, title, and add at least one herb' : 'Please fill in all required fields and add at least one herb',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      // Validate recommendation data
      const validatedRecommendation = recommendationSchema.parse({
        practitioner_id: practitionerId,
        patient_id: formData.patient_id,
        title: formData.title,
        diagnosis: formData.diagnosis || '',
        instructions: formData.instructions || '',
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null
      });

      // Validate herb items
      for (const item of herbItems) {
        herbItemSchema.parse({
          herb_id: item.herb_id,
          quantity: item.quantity,
          unit_price: herbs.find(h => h.id === item.herb_id)?.retail_price || 0,
          dosage_instructions: item.dosage_instructions || ''
        });

        // Check stock availability
        const herb = herbs.find(h => h.id === item.herb_id);
        if (herb && herb.stock_quantity < item.quantity) {
          toast({
            title: 'Insufficient Stock',
            description: `Not enough stock for ${herb.name}`,
            variant: 'destructive'
          });
          return;
        }
      }
      // Create or update recommendation
      if (recommendation) {
        // Update existing recommendation
        const {
          error: recError
        } = await supabase.from('recommendations').update({
          title: validatedRecommendation.title,
          diagnosis: validatedRecommendation.diagnosis || null,
          instructions: validatedRecommendation.instructions || null,
          duration_days: validatedRecommendation.duration_days,
          total_cost: calculateTotal()
        }).eq('id', recommendation.id);
        if (recError) throw recError;

        // Delete existing items
        await supabase.from('recommendation_items').delete().eq('recommendation_id', recommendation.id);

        // Create new items
        const items = herbItems.map(item => ({
          recommendation_id: recommendation.id,
          herb_id: item.herb_id,
          quantity: item.quantity,
          dosage_instructions: item.dosage_instructions || null,
          unit_price: herbs.find(h => h.id === item.herb_id)?.retail_price || 0
        }));
        const {
          error: itemsError
        } = await supabase.from('recommendation_items').insert(items);
        if (itemsError) throw itemsError;
        toast({
          title: 'Success',
          description: 'Recommendation updated successfully'
        });
        resetForm();
        onSuccess();
      } else {
        // Create new recommendation
        const {
          data: newRecommendation,
          error: recError
        } = await supabase.from('recommendations').insert({
          practitioner_id: validatedRecommendation.practitioner_id,
          patient_id: validatedRecommendation.patient_id,
          title: validatedRecommendation.title,
          diagnosis: validatedRecommendation.diagnosis || null,
          instructions: validatedRecommendation.instructions || null,
          duration_days: validatedRecommendation.duration_days,
          status: 'draft',
          total_cost: calculateTotal()
        }).select().single();
        if (recError) throw recError;

        // Create recommendation items
        const items = herbItems.map(item => ({
          recommendation_id: newRecommendation.id,
          herb_id: item.herb_id,
          quantity: item.quantity,
          dosage_instructions: item.dosage_instructions || null,
          unit_price: herbs.find(h => h.id === item.herb_id)?.retail_price || 0
        }));
        const {
          error: itemsError
        } = await supabase.from('recommendation_items').insert(items);
        if (itemsError) throw itemsError;
        
        // Track GA4 event
        trackEvent('create_recommendation', {
          recommendation_id: newRecommendation.id,
          patient_id: validatedRecommendation.patient_id,
          total_cost: calculateTotal(),
          herb_count: herbItems.length,
          value: calculateTotal(),
          currency: 'THB',
          items: herbItems.map(item => ({
            item_id: item.herb_id,
            item_name: herbs.find(h => h.id === item.herb_id)?.name || '',
            quantity: item.quantity,
            price: herbs.find(h => h.id === item.herb_id)?.retail_price || 0,
          })),
        });
        
        toast({
          title: 'Success',
          description: sendImmediately ? 'Recommendation created. Opening send dialog...' : 'Recommendation saved as draft'
        });
        if (sendImmediately) {
          setCreatedRecommendationId(newRecommendation.id);
          setSendDialogOpen(true);
        } else {
          resetForm();
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Error creating recommendation:', error);
      
      // Track error in GA4
      trackException('recommendation_creation_failed', false);
      
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create recommendation',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setFormData({
      practitioner_id: '',
      patient_id: '',
      title: '',
      diagnosis: '',
      instructions: '',
      duration_days: ''
    });
    setHerbItems([]);
    setCreatedRecommendationId(null);
    onOpenChange(false);
  };
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{recommendation ? 'Edit Recommendation' : 'Create New Recommendation'}</DialogTitle>
            <DialogDescription>
              {recommendation ? 'Update the herbal prescription details' : 'Create a personalized herbal prescription for your patient'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeRole === 'admin' && <div className="space-y-2">
                <Label htmlFor="practitioner">Practitioner *</Label>
                <Select value={formData.practitioner_id} onValueChange={value => setFormData({
              ...formData,
              practitioner_id: value
            })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a practitioner" />
                  </SelectTrigger>
                  <SelectContent>
                    {practitioners.map(practitioner => <SelectItem key={practitioner.id} value={practitioner.id}>
                        {practitioner.full_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}

            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <Select value={formData.patient_id} onValueChange={value => setFormData({
              ...formData,
              patient_id: value
            })} disabled={!!recommendation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formData.title} onChange={e => setFormData({
              ...formData,
              title: e.target.value
            })} placeholder="e.g., Treatment for Common Cold" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea id="diagnosis" value={formData.diagnosis} onChange={e => setFormData({
              ...formData,
              diagnosis: e.target.value
            })} placeholder="Describe the diagnosis..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea id="instructions" value={formData.instructions} onChange={e => setFormData({
              ...formData,
              instructions: e.target.value
            })} placeholder="Special instructions for the patient..." rows={3} />
            </div>

            

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Herbs * (at least 1 required)</Label>
                <Button type="button" onClick={addHerbItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Herb
                </Button>
              </div>

              {herbItems.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
                  No herbs added yet. Click "Add Herb" to start building the recommendation.
                </div>
              ) : (
                <div className="space-y-3">
                  {herbItems.map((item, index) => <div key={index} className="flex gap-2 items-end border p-3 rounded-lg bg-muted/50">
                      <div className="flex-1 space-y-2">
                        <Select value={item.herb_id} onValueChange={value => updateHerbItem(index, 'herb_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select herb" />
                          </SelectTrigger>
                          <SelectContent>
                            {herbs.map(herb => <SelectItem key={herb.id} value={herb.id}>
                                {herb.name} {herb.thai_name && `(${herb.thai_name})`} - ฿{herb.retail_price} (Stock: {herb.stock_quantity})
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Label>Quantity</Label>
                        <Input type="number" min="1" value={item.quantity} onChange={e => updateHerbItem(index, 'quantity', parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="flex-1">
                        <Label>Dosage Instructions</Label>
                        <Input value={item.dosage_instructions} onChange={e => updateHerbItem(index, 'dosage_instructions', e.target.value)} placeholder="e.g., Take 2 tablets daily" />
                      </div>
                      <Button type="button" onClick={() => removeHerbItem(index)} variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>)}
                </div>
              )}
            </div>

            {herbItems.length > 0 && <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                <span className="font-semibold">Total Cost:</span>
                <span className="text-2xl font-bold">฿{calculateTotal().toFixed(2)}</span>
              </div>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm} disabled={loading}>
              Cancel
            </Button>
            {recommendation ? <Button onClick={() => handleSubmit(false)} disabled={loading || herbItems.length === 0}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button> : <>
                <Button onClick={() => handleSubmit(false)} disabled={loading || herbItems.length === 0}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save as Draft
                </Button>
                <Button onClick={() => handleSubmit(true)} disabled={loading || herbItems.length === 0}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send to Patient
                </Button>
              </>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {createdRecommendationId && <SendRecommendationDialog recommendationId={createdRecommendationId} open={sendDialogOpen} onOpenChange={setSendDialogOpen} onSuccess={() => {
      setSendDialogOpen(false);
      resetForm();
      onSuccess();
    }} />}
    </>;
}