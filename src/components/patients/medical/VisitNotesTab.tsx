import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, FileText, Calendar, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { format } from 'date-fns';
import { FaceMapMarker, type FaceMarker } from '../skincare/FaceMapMarker';
import { exportVisitSummaryToPDF } from '@/lib/exportVisitSummary';
import { logger } from '@/lib/logger';

interface VisitNote {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  is_private: boolean;
  present_illness: string | null;
  general_appearance: string | null;
  tongue_examination: string | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  vital_notes: string | null;
  body_diagram_front: any;
  body_diagram_back: any;
  abdominal_palpation: string | null;
  other_findings: string | null;
  ttm_diagnosis: string | null;
  ttm_pattern_identification: string | null;
  western_diagnosis: string | null;
  treatment_plan: string | null;
  herbal_prescription: string | null;
  dietary_recommendations: string | null;
  lifestyle_recommendations: string | null;
  follow_up_plan: string | null;
  practitioner_notes: string | null;
}

interface Visit {
  id: string;
  visit_date: string;
  chief_complaint: string;
  visit_type: string;
  duration_minutes: number | null;
  status: string;
  visit_notes?: VisitNote[];
}

interface VisitNotesTabProps {
  patientId: string;
  isAdminMode?: boolean;
}

export function VisitNotesTab({ patientId, isAdminMode = false }: VisitNotesTabProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [activeBodyView, setActiveBodyView] = useState<'front' | 'left' | 'right'>('front');
  const [patient, setPatient] = useState<any>(null);
  const [markerTypes, setMarkerTypes] = useState<any[]>([]);
  const [exportingVisitId, setExportingVisitId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    visit_type: 'consultation',
    duration_minutes: '',
    // SOAP Notes
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    is_private: false,
    // Visit-specific history
    present_illness: '',
    // Vital Signs
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature: '',
    weight: '',
    height: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    vital_notes: '',
    // Examination
    general_appearance: '',
    tongue_examination: '',
    abdominal_palpation: '',
    other_findings: '',
    // Assessment & Plan
    ttm_diagnosis: '',
    ttm_pattern_identification: '',
    western_diagnosis: '',
    treatment_plan: '',
    herbal_prescription: '',
    dietary_recommendations: '',
    lifestyle_recommendations: '',
    follow_up_plan: '',
    practitioner_notes: '',
  });

  const [bodyDiagrams, setBodyDiagrams] = useState<{
    front: FaceMarker[];
    left: FaceMarker[];
    right: FaceMarker[];
  }>({
    front: [],
    left: [],
    right: [],
  });

  useEffect(() => {
    fetchVisits();
    fetchPatient();
    fetchMarkerTypes();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error: any) {
      logger.error('Error fetching patient:', error);
    }
  };

  const fetchMarkerTypes = async () => {
    try {
      const { data } = await supabase
        .from('body_marker_types')
        .select('*')
        .order('is_system_default', { ascending: false })
        .order('name');

      if (data) {
        setMarkerTypes(data);
      }
    } catch (error: any) {
      logger.error('Error fetching marker types:', error);
    }
  };

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_visits')
        .select(`
          *,
          visit_notes (*)
        `)
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingVisitId) {
        // Update existing visit
        const { error: visitError } = await supabase
          .from('patient_visits')
          .update({
            visit_date: new Date(formData.visit_date).toISOString(),
            chief_complaint: formData.chief_complaint,
            visit_type: formData.visit_type,
            duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
          })
          .eq('id', editingVisitId);

        if (visitError) throw visitError;

        // Update visit notes
        const { error: notesError } = await supabase
          .from('visit_notes')
          .update({
            // SOAP Notes
            subjective: formData.subjective || null,
            objective: formData.objective || null,
            assessment: formData.assessment || null,
            plan: formData.plan || null,
            is_private: formData.is_private,
            // Visit-specific history
            present_illness: formData.present_illness || null,
            // Vital Signs
            blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
            blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
            heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
            temperature: formData.temperature ? parseFloat(formData.temperature) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            height: formData.height ? parseFloat(formData.height) : null,
            respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
            oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
            vital_notes: formData.vital_notes || null,
            // Body Diagrams (Face Maps)
            body_diagram_front: bodyDiagrams.front as any,
            body_diagram_back: { left: bodyDiagrams.left, right: bodyDiagrams.right } as any,
            // Examination
            general_appearance: formData.general_appearance || null,
            tongue_examination: formData.tongue_examination || null,
            abdominal_palpation: formData.abdominal_palpation || null,
            other_findings: formData.other_findings || null,
            // Assessment & Plan
            ttm_diagnosis: formData.ttm_diagnosis || null,
            ttm_pattern_identification: formData.ttm_pattern_identification || null,
            western_diagnosis: formData.western_diagnosis || null,
            treatment_plan: formData.treatment_plan || null,
            herbal_prescription: formData.herbal_prescription || null,
            dietary_recommendations: formData.dietary_recommendations || null,
            lifestyle_recommendations: formData.lifestyle_recommendations || null,
            follow_up_plan: formData.follow_up_plan || null,
            practitioner_notes: formData.practitioner_notes || null,
          } as any)
          .eq('visit_id', editingVisitId);

        if (notesError) throw notesError;

        toast({
          title: 'Success',
          description: 'Visit notes updated successfully',
        });
      } else {
        // Create new visit
        const { data: visit, error: visitError } = await supabase
          .from('patient_visits')
          .insert({
            patient_id: patientId,
            practitioner_id: user.id,
            visit_date: new Date(formData.visit_date).toISOString(),
            chief_complaint: formData.chief_complaint,
            visit_type: formData.visit_type,
            duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
          })
          .select()
          .single();

        if (visitError) throw visitError;

        // Create comprehensive visit notes with all fields
        const { error: notesError } = await supabase
          .from('visit_notes')
          .insert({
            visit_id: visit.id,
            // SOAP Notes
            subjective: formData.subjective || null,
            objective: formData.objective || null,
            assessment: formData.assessment || null,
            plan: formData.plan || null,
            is_private: formData.is_private,
            // Visit-specific history
            present_illness: formData.present_illness || null,
            // Vital Signs
            blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
            blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
            heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
            temperature: formData.temperature ? parseFloat(formData.temperature) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            height: formData.height ? parseFloat(formData.height) : null,
            respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
            oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
            vital_notes: formData.vital_notes || null,
            // Body Diagrams (Face Maps)
            body_diagram_front: bodyDiagrams.front as any,
            body_diagram_back: { left: bodyDiagrams.left, right: bodyDiagrams.right } as any,
            // Examination
            general_appearance: formData.general_appearance || null,
            tongue_examination: formData.tongue_examination || null,
            abdominal_palpation: formData.abdominal_palpation || null,
            other_findings: formData.other_findings || null,
            // Assessment & Plan
            ttm_diagnosis: formData.ttm_diagnosis || null,
            ttm_pattern_identification: formData.ttm_pattern_identification || null,
            western_diagnosis: formData.western_diagnosis || null,
            treatment_plan: formData.treatment_plan || null,
            herbal_prescription: formData.herbal_prescription || null,
            dietary_recommendations: formData.dietary_recommendations || null,
            lifestyle_recommendations: formData.lifestyle_recommendations || null,
            follow_up_plan: formData.follow_up_plan || null,
            practitioner_notes: formData.practitioner_notes || null,
          } as any);

        if (notesError) throw notesError;

        toast({
          title: 'Success',
          description: 'Visit notes created successfully',
        });
      }

      // Reset form
      resetForm();
      fetchVisits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingVisitId(null);
    setFormData({
      visit_date: new Date().toISOString().split('T')[0],
      chief_complaint: '',
      visit_type: 'consultation',
      duration_minutes: '',
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      is_private: false,
      present_illness: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      temperature: '',
      weight: '',
      height: '',
      respiratory_rate: '',
      oxygen_saturation: '',
      vital_notes: '',
      general_appearance: '',
      tongue_examination: '',
      abdominal_palpation: '',
      other_findings: '',
      ttm_diagnosis: '',
      ttm_pattern_identification: '',
      western_diagnosis: '',
      treatment_plan: '',
      herbal_prescription: '',
      dietary_recommendations: '',
      lifestyle_recommendations: '',
      follow_up_plan: '',
      practitioner_notes: '',
    });
    setBodyDiagrams({ front: [], back: [] });
    setActiveTab('basic');
  };

  const handleEditVisit = (visit: Visit) => {
    const notes = visit.visit_notes?.[0];
    
    setEditingVisitId(visit.id);
    setFormData({
      visit_date: new Date(visit.visit_date).toISOString().split('T')[0],
      chief_complaint: visit.chief_complaint,
      visit_type: visit.visit_type,
      duration_minutes: visit.duration_minutes?.toString() || '',
      subjective: notes?.subjective || '',
      objective: notes?.objective || '',
      assessment: notes?.assessment || '',
      plan: notes?.plan || '',
      is_private: notes?.is_private || false,
      present_illness: notes?.present_illness || '',
      blood_pressure_systolic: notes?.blood_pressure_systolic?.toString() || '',
      blood_pressure_diastolic: notes?.blood_pressure_diastolic?.toString() || '',
      heart_rate: notes?.heart_rate?.toString() || '',
      temperature: notes?.temperature?.toString() || '',
      weight: notes?.weight?.toString() || '',
      height: notes?.height?.toString() || '',
      respiratory_rate: notes?.respiratory_rate?.toString() || '',
      oxygen_saturation: notes?.oxygen_saturation?.toString() || '',
      vital_notes: notes?.vital_notes || '',
      general_appearance: notes?.general_appearance || '',
      tongue_examination: notes?.tongue_examination || '',
      abdominal_palpation: notes?.abdominal_palpation || '',
      other_findings: notes?.other_findings || '',
      ttm_diagnosis: notes?.ttm_diagnosis || '',
      ttm_pattern_identification: notes?.ttm_pattern_identification || '',
      western_diagnosis: notes?.western_diagnosis || '',
      treatment_plan: notes?.treatment_plan || '',
      herbal_prescription: notes?.herbal_prescription || '',
      dietary_recommendations: notes?.dietary_recommendations || '',
      lifestyle_recommendations: notes?.lifestyle_recommendations || '',
      follow_up_plan: notes?.follow_up_plan || '',
      practitioner_notes: notes?.practitioner_notes || '',
    });
    
    // Handle both old format (array) and new format (object with left/right)
    const backData = notes?.body_diagram_back;
    const leftData = Array.isArray(backData) ? backData : (backData?.left || []);
    const rightData = Array.isArray(backData) ? [] : (backData?.right || []);
    
    setBodyDiagrams({
      front: notes?.body_diagram_front || [],
      left: leftData,
      right: rightData,
    });
    
    setIsDialogOpen(true);
  };

  const handleExportVisit = async (visit: Visit) => {
    if (!patient) {
      toast({
        title: 'Error',
        description: 'Patient data not loaded',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExportingVisitId(visit.id);
      await exportVisitSummaryToPDF(visit, patient, markerTypes);
      toast({
        title: 'Success',
        description: 'Visit summary exported successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export visit summary',
        variant: 'destructive',
      });
    } finally {
      setExportingVisitId(null);
    }
  };

  if (loading && visits.length === 0) {
    return <div className="text-center py-8">Loading visits...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Visit History</h3>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Visit
        </Button>
      </div>

      {visits.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No visits recorded yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => {
            const isExpanded = expandedVisit === visit.id;
            const notes = visit.visit_notes?.[0];
            
            return (
              <Card key={visit.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(visit.visit_date), 'PPP')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {visit.visit_type} {visit.duration_minutes && `• ${visit.duration_minutes} min`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {notes && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditVisit(visit);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportVisit(visit)}
                          disabled={exportingVisitId === visit.id}
                        >
                          {exportingVisitId === visit.id ? (
                            <>
                              <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Export PDF
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              View Full Details
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Chief Complaint:</span>
                    <p className="text-sm text-muted-foreground">{visit.chief_complaint}</p>
                  </div>

                  {notes && (
                    <>
                      {notes.is_private && (
                        <Badge variant="secondary" className="mt-2">
                          🔒 Private Note {!isAdminMode && '(visible to practitioners only)'}
                        </Badge>
                      )}

                      {isExpanded ? (
                        <div className="mt-4 pt-4 border-t">
                          <Tabs defaultValue="hpi" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                              <TabsTrigger value="hpi">HPI</TabsTrigger>
                              <TabsTrigger value="vitals">Vitals</TabsTrigger>
                              <TabsTrigger value="exam">Exam</TabsTrigger>
                              <TabsTrigger value="assessment">Assessment</TabsTrigger>
                            </TabsList>

                            <TabsContent value="hpi" className="space-y-4">
                              {notes.present_illness && (
                                <div>
                                  <span className="text-sm font-medium">Present Illness:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.present_illness}</p>
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="vitals" className="space-y-3">
                              {notes.blood_pressure_systolic && notes.blood_pressure_diastolic && (
                                <div>
                                  <span className="text-sm font-medium">Blood Pressure:</span>
                                  <p className="text-sm text-muted-foreground">
                                    {notes.blood_pressure_systolic}/{notes.blood_pressure_diastolic} mmHg
                                  </p>
                                </div>
                              )}
                              {notes.heart_rate && (
                                <div>
                                  <span className="text-sm font-medium">Heart Rate:</span>
                                  <p className="text-sm text-muted-foreground">{notes.heart_rate} bpm</p>
                                </div>
                              )}
                              {notes.temperature && (
                                <div>
                                  <span className="text-sm font-medium">Temperature:</span>
                                  <p className="text-sm text-muted-foreground">{notes.temperature}°C</p>
                                </div>
                              )}
                              {notes.weight && (
                                <div>
                                  <span className="text-sm font-medium">Weight:</span>
                                  <p className="text-sm text-muted-foreground">{notes.weight} kg</p>
                                </div>
                              )}
                              {notes.height && (
                                <div>
                                  <span className="text-sm font-medium">Height:</span>
                                  <p className="text-sm text-muted-foreground">{notes.height} cm</p>
                                </div>
                              )}
                              {notes.respiratory_rate && (
                                <div>
                                  <span className="text-sm font-medium">Respiratory Rate:</span>
                                  <p className="text-sm text-muted-foreground">{notes.respiratory_rate} /min</p>
                                </div>
                              )}
                              {notes.oxygen_saturation && (
                                <div>
                                  <span className="text-sm font-medium">O2 Saturation:</span>
                                  <p className="text-sm text-muted-foreground">{notes.oxygen_saturation}%</p>
                                </div>
                              )}
                              {notes.vital_notes && (
                                <div className="pt-2 border-t">
                                  <span className="text-sm font-medium">Notes:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.vital_notes}</p>
                                </div>
                              )}
                              {!notes.blood_pressure_systolic && !notes.heart_rate && !notes.temperature && 
                               !notes.weight && !notes.height && !notes.respiratory_rate && !notes.oxygen_saturation && (
                                <p className="text-sm text-muted-foreground">No vital signs recorded for this visit</p>
                              )}
                            </TabsContent>

                            <TabsContent value="exam" className="space-y-4">
                              {notes.general_appearance && (
                                <div>
                                  <span className="text-sm font-medium">General Appearance:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.general_appearance}</p>
                                </div>
                              )}
                              {notes.tongue_examination && (
                                <div>
                                  <span className="text-sm font-medium">Tongue Examination:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.tongue_examination}</p>
                                </div>
                              )}
                              {notes.abdominal_palpation && (
                                <div>
                                  <span className="text-sm font-medium">Abdominal Palpation:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.abdominal_palpation}</p>
                                </div>
                              )}
                              {notes.other_findings && (
                                <div>
                                  <span className="text-sm font-medium">Other Findings:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.other_findings}</p>
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="assessment" className="space-y-4">
                              {notes.ttm_diagnosis && (
                                <div>
                                  <span className="text-sm font-medium">TTM Diagnosis:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.ttm_diagnosis}</p>
                                </div>
                              )}
                              {notes.ttm_pattern_identification && (
                                <div>
                                  <span className="text-sm font-medium">Pattern Identification:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.ttm_pattern_identification}</p>
                                </div>
                              )}
                              {notes.western_diagnosis && (
                                <div>
                                  <span className="text-sm font-medium">Western Diagnosis:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.western_diagnosis}</p>
                                </div>
                              )}
                              {notes.treatment_plan && (
                                <div>
                                  <span className="text-sm font-medium">Treatment Plan:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.treatment_plan}</p>
                                </div>
                              )}
                              {notes.herbal_prescription && (
                                <div>
                                  <span className="text-sm font-medium">Herbal Prescription:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.herbal_prescription}</p>
                                </div>
                              )}
                              {notes.dietary_recommendations && (
                                <div>
                                  <span className="text-sm font-medium">Dietary Recommendations:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.dietary_recommendations}</p>
                                </div>
                              )}
                              {notes.lifestyle_recommendations && (
                                <div>
                                  <span className="text-sm font-medium">Lifestyle Recommendations:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.lifestyle_recommendations}</p>
                                </div>
                              )}
                              {notes.follow_up_plan && (
                                <div>
                                  <span className="text-sm font-medium">Follow-up Plan:</span>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.follow_up_plan}</p>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                          {notes.ttm_diagnosis && (
                            <div>
                              <span className="text-sm font-medium">TTM Diagnosis:</span>
                              <p className="text-sm text-muted-foreground line-clamp-2">{notes.ttm_diagnosis}</p>
                            </div>
                          )}
                          {notes.treatment_plan && (
                            <div>
                              <span className="text-sm font-medium">Treatment Plan:</span>
                              <p className="text-sm text-muted-foreground line-clamp-2">{notes.treatment_plan}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingVisitId ? 'Edit Visit Notes' : 'Add Visit Notes'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="exam">Examination</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
            </TabsList>

              <div className="flex-1 overflow-y-auto pr-2">
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visit_date">Visit Date</Label>
                      <Input
                        id="visit_date"
                        type="date"
                        value={formData.visit_date}
                        onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visit_type">Visit Type</Label>
                      <Select value={formData.visit_type} onValueChange={(value) => setFormData({ ...formData, visit_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="routine">Routine Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chief_complaint">Chief Complaint</Label>
                    <Input
                      id="chief_complaint"
                      value={formData.chief_complaint}
                      onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                      placeholder="Main reason for visit"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="present_illness">Present Illness (HPI)</Label>
                    <Textarea
                      id="present_illness"
                      value={formData.present_illness}
                      onChange={(e) => setFormData({ ...formData, present_illness: e.target.value })}
                      placeholder="History of present illness..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="vitals" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bp_systolic">Blood Pressure (Systolic)</Label>
                      <Input
                        id="bp_systolic"
                        type="number"
                        value={formData.blood_pressure_systolic}
                        onChange={(e) => setFormData({ ...formData, blood_pressure_systolic: e.target.value })}
                        placeholder="120 mmHg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bp_diastolic">Blood Pressure (Diastolic)</Label>
                      <Input
                        id="bp_diastolic"
                        type="number"
                        value={formData.blood_pressure_diastolic}
                        onChange={(e) => setFormData({ ...formData, blood_pressure_diastolic: e.target.value })}
                        placeholder="80 mmHg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                      <Input
                        id="heart_rate"
                        type="number"
                        value={formData.heart_rate}
                        onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                        placeholder="72"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        placeholder="36.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="70.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="170"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="respiratory_rate">Respiratory Rate (/min)</Label>
                      <Input
                        id="respiratory_rate"
                        type="number"
                        value={formData.respiratory_rate}
                        onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                        placeholder="16"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oxygen_saturation">O2 Saturation (%)</Label>
                      <Input
                        id="oxygen_saturation"
                        type="number"
                        value={formData.oxygen_saturation}
                        onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
                        placeholder="98"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vital_notes">Vital Signs Notes</Label>
                    <Textarea
                      id="vital_notes"
                      value={formData.vital_notes}
                      onChange={(e) => setFormData({ ...formData, vital_notes: e.target.value })}
                      placeholder="Additional observations about vital signs"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="body" className="space-y-4 mt-4">
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={activeBodyView === 'front' ? 'default' : 'outline'}
                      onClick={() => setActiveBodyView('front')}
                    >
                      Front View
                    </Button>
                    <Button
                      type="button"
                      variant={activeBodyView === 'left' ? 'default' : 'outline'}
                      onClick={() => setActiveBodyView('left')}
                    >
                      Left Profile
                    </Button>
                    <Button
                      type="button"
                      variant={activeBodyView === 'right' ? 'default' : 'outline'}
                      onClick={() => setActiveBodyView('right')}
                    >
                      Right Profile
                    </Button>
                  </div>
                  <FaceMapMarker
                    markers={bodyDiagrams[activeBodyView]}
                    onChange={(markers) =>
                      setBodyDiagrams({
                        ...bodyDiagrams,
                        [activeBodyView]: markers,
                      })
                    }
                    side={activeBodyView}
                  />
                </TabsContent>

                <TabsContent value="exam" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="general_appearance">General Appearance</Label>
                    <Textarea
                      id="general_appearance"
                      value={formData.general_appearance}
                      onChange={(e) => setFormData({ ...formData, general_appearance: e.target.value })}
                      placeholder="General appearance observations"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tongue_examination">Tongue Examination</Label>
                    <Textarea
                      id="tongue_examination"
                      value={formData.tongue_examination}
                      onChange={(e) => setFormData({ ...formData, tongue_examination: e.target.value })}
                      placeholder="Tongue examination findings"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="abdominal_palpation">Abdominal Palpation</Label>
                    <Textarea
                      id="abdominal_palpation"
                      value={formData.abdominal_palpation}
                      onChange={(e) => setFormData({ ...formData, abdominal_palpation: e.target.value })}
                      placeholder="Abdominal palpation findings"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other_findings">Other Findings</Label>
                    <Textarea
                      id="other_findings"
                      value={formData.other_findings}
                      onChange={(e) => setFormData({ ...formData, other_findings: e.target.value })}
                      placeholder="Other examination findings"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="assessment" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="ttm_diagnosis">TTM Diagnosis</Label>
                    <Textarea
                      id="ttm_diagnosis"
                      value={formData.ttm_diagnosis}
                      onChange={(e) => setFormData({ ...formData, ttm_diagnosis: e.target.value })}
                      placeholder="Traditional Tibetan Medicine diagnosis"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ttm_pattern_identification">Pattern Identification</Label>
                    <Textarea
                      id="ttm_pattern_identification"
                      value={formData.ttm_pattern_identification}
                      onChange={(e) => setFormData({ ...formData, ttm_pattern_identification: e.target.value })}
                      placeholder="Pattern identification"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="western_diagnosis">Western Diagnosis</Label>
                    <Textarea
                      id="western_diagnosis"
                      value={formData.western_diagnosis}
                      onChange={(e) => setFormData({ ...formData, western_diagnosis: e.target.value })}
                      placeholder="Western medicine diagnosis"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatment_plan">Treatment Plan</Label>
                    <Textarea
                      id="treatment_plan"
                      value={formData.treatment_plan}
                      onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                      placeholder="Treatment plan"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="herbal_prescription">Herbal Prescription</Label>
                    <Textarea
                      id="herbal_prescription"
                      value={formData.herbal_prescription}
                      onChange={(e) => setFormData({ ...formData, herbal_prescription: e.target.value })}
                      placeholder="Herbal prescription details"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dietary_recommendations">Dietary Recommendations</Label>
                    <Textarea
                      id="dietary_recommendations"
                      value={formData.dietary_recommendations}
                      onChange={(e) => setFormData({ ...formData, dietary_recommendations: e.target.value })}
                      placeholder="Dietary recommendations"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lifestyle_recommendations">Lifestyle Recommendations</Label>
                    <Textarea
                      id="lifestyle_recommendations"
                      value={formData.lifestyle_recommendations}
                      onChange={(e) => setFormData({ ...formData, lifestyle_recommendations: e.target.value })}
                      placeholder="Lifestyle recommendations"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="follow_up_plan">Follow-up Plan</Label>
                    <Textarea
                      id="follow_up_plan"
                      value={formData.follow_up_plan}
                      onChange={(e) => setFormData({ ...formData, follow_up_plan: e.target.value })}
                      placeholder="Follow-up plan"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practitioner_notes">Practitioner Notes (Private)</Label>
                    <Textarea
                      id="practitioner_notes"
                      value={formData.practitioner_notes}
                      onChange={(e) => setFormData({ ...formData, practitioner_notes: e.target.value })}
                      placeholder="Private notes for practitioners only"
                      rows={3}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">SOAP Notes</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subjective">Subjective</Label>
                        <Textarea
                          id="subjective"
                          value={formData.subjective}
                          onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
                          placeholder="Student's description of symptoms"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="objective">Objective</Label>
                        <Textarea
                          id="objective"
                          value={formData.objective}
                          onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                          placeholder="Clinical observations and measurements"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assessment">Assessment</Label>
                        <Textarea
                          id="assessment"
                          value={formData.assessment}
                          onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                          placeholder="Diagnosis or clinical impression"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan">Plan</Label>
                        <Textarea
                          id="plan"
                          value={formData.plan}
                          onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                          placeholder="Treatment plan and recommendations"
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="is_private"
                          checked={formData.is_private}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked as boolean })}
                        />
                        <Label htmlFor="is_private" className="text-sm font-normal cursor-pointer">
                          Mark notes as private (hidden from student)
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (editingVisitId ? 'Update Visit' : 'Save Visit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
