import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Send, Trash2, ExternalLink } from 'lucide-react';
import { SendRecommendationDialog } from './SendRecommendationDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useRole } from '@/contexts/RoleContext';

interface RecommendationDetailDialogProps {
  recommendationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface RecommendationDetail {
  id: string;
  title: string;
  diagnosis: string | null;
  instructions: string | null;
  status: string;
  total_cost: number | null;
  duration_days: number | null;
  created_at: string;
  sent_at: string | null;
  patients: { full_name: string; email: string | null };
  profiles: { full_name: string };
  recommendation_items: Array<{
    quantity: number;
    dosage_instructions: string | null;
    unit_price: number;
    herbs: { name: string; thai_name: string | null };
  }>;
}

export function RecommendationDetailDialog({ recommendationId, open, onOpenChange, onUpdate }: RecommendationDetailDialogProps) {
  const { toast } = useToast();
  const { activeRole } = useRole();
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<RecommendationDetail | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && recommendationId) {
      fetchRecommendation();
    }
  }, [open, recommendationId]);

  const fetchRecommendation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          patients!inner(full_name, email),
          profiles!recommendations_practitioner_id_fkey(full_name),
          recommendation_items(
            quantity,
            dosage_instructions,
            unit_price,
            herbs(name, thai_name)
          )
        `)
        .eq('id', recommendationId)
        .single();

      if (error) throw error;
      setRecommendation(data);

      // Fetch checkout link if payment is pending or status is sent
      if ((data.status === 'sent' || data.status === 'payment_pending') && activeRole === 'patient') {
        try {
          const { data: linkData, error: linkError } = await supabase.functions.invoke('generate-checkout-link', {
            body: { recommendation_id: recommendationId }
          });

          if (linkError) throw linkError;
          
          if (linkData?.checkout_url) {
            setCheckoutUrl(linkData.checkout_url);
          }
        } catch (error) {
          console.error('Error generating checkout link:', error);
          toast({
            title: 'Error',
            description: 'Failed to load checkout link. Please try again.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recommendation details',
        variant: 'destructive',
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recommendation) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', recommendation.id);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Recommendation deleted successfully',
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting recommendation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete recommendation',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading || !recommendation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{recommendation.title}</DialogTitle>
                <DialogDescription className="mt-2">
                  Patient: {recommendation.patients.full_name}
                </DialogDescription>
              </div>
              <Badge variant={
                recommendation.status === 'draft' ? 'secondary' :
                recommendation.status === 'payment_pending' ? 'outline' :
                recommendation.status === 'paid' ? 'default' :
                recommendation.status === 'shipped' ? 'default' :
                recommendation.status === 'delivered' ? 'default' : 'outline'
              }>
                {recommendation.status === 'payment_pending' ? 'Payment Pending' : 
                 recommendation.status === 'paid' ? 'Paid' :
                 recommendation.status === 'shipped' ? 'Shipped' :
                 recommendation.status === 'delivered' ? 'Delivered' :
                 recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{new Date(recommendation.created_at).toLocaleDateString()}</p>
              </div>
              {recommendation.sent_at && (
                <div>
                  <span className="text-muted-foreground">Sent:</span>
                  <p className="font-medium">{new Date(recommendation.sent_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            {recommendation.diagnosis && (
              <div className="space-y-2">
                <h3 className="font-semibold">Diagnosis</h3>
                <p className="text-sm bg-muted p-3 rounded-lg">{recommendation.diagnosis}</p>
              </div>
            )}

            {/* Instructions */}
            {recommendation.instructions && (
              <div className="space-y-2">
                <h3 className="font-semibold">Instructions</h3>
                <p className="text-sm bg-muted p-3 rounded-lg">{recommendation.instructions}</p>
              </div>
            )}

            {/* Duration */}
            {recommendation.duration_days && (
              <div className="space-y-2">
                <h3 className="font-semibold">Duration</h3>
                <p className="text-sm">{recommendation.duration_days} days</p>
              </div>
            )}

            {/* Prescribed Herbs */}
            <div className="space-y-2">
              <h3 className="font-semibold">Prescribed Herbs</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Herb</th>
                      <th className="text-left p-3">Quantity</th>
                      <th className="text-left p-3">Dosage</th>
                      <th className="text-right p-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendation.recommendation_items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">
                          {item.herbs.name}
                          {item.herbs.thai_name && (
                            <span className="text-muted-foreground"> ({item.herbs.thai_name})</span>
                          )}
                        </td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3 text-muted-foreground">
                          {item.dosage_instructions || 'As prescribed'}
                        </td>
                        <td className="p-3 text-right">
                          ฿{(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-semibold">
                    <tr>
                      <td colSpan={3} className="p-3 text-right">Total:</td>
                      <td className="p-3 text-right text-lg">
                        ฿{recommendation.total_cost?.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Checkout Link for Patients */}
            {activeRole === 'patient' && (recommendation.status === 'sent' || recommendation.status === 'payment_pending') && checkoutUrl && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  {recommendation.status === 'payment_pending' ? 'Complete Your Payment' : 'Proceed to Checkout'}
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                  {recommendation.status === 'payment_pending' 
                    ? 'Your order is waiting for payment. Click below to complete your purchase.'
                    : 'Click the link below to proceed with checkout and complete your order.'}
                </p>
                <Button asChild className="w-full">
                  <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {recommendation.status === 'payment_pending' ? 'Pay Now' : 'Go to Checkout'}
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end border-t pt-4">
            {activeRole !== 'patient' && (
              <>
                {recommendation.status === 'draft' && (
                  <>
                    <Button variant="outline" onClick={() => setSendDialogOpen(true)}>
                      <Send className="h-4 w-4 mr-2" />
                      Send to Patient
                    </Button>
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
                {(recommendation.status === 'payment_pending' || recommendation.status === 'paid' || recommendation.status === 'shipped') && (
                  <Button variant="outline" onClick={() => setSendDialogOpen(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Resend
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SendRecommendationDialog
        recommendationId={recommendationId}
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onSuccess={() => {
          setSendDialogOpen(false);
          fetchRecommendation();
          onUpdate();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recommendation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recommendation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}