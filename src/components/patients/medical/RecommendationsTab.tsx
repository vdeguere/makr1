import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Pill, Plus, Send, Edit, Copy, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { RecommendationFormDialog } from "@/components/recommendations/RecommendationFormDialog";
import { SendRecommendationDialog } from "@/components/recommendations/SendRecommendationDialog";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { logger } from "@/lib/logger";

interface RecommendationsTabProps {
  patientId: string;
}

export function RecommendationsTab({ patientId }: RecommendationsTabProps) {
  const { activeRole } = useRole();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  
  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['patient-recommendations', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          recommendation_items(
            id,
            quantity,
            dosage_instructions,
            herbs(name, thai_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Pill className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This patient doesn't have any herb recommendations yet.
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Recommendation
          </Button>
        </div>

        <RecommendationFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          defaultPatientId={patientId}
          onSuccess={() => {
            refetch();
            setIsFormOpen(false);
          }}
        />
      </>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleDuplicate = async (rec: any) => {
    try {
      // Create new recommendation with same data
      const { data: newRec, error: recError } = await supabase
        .from('recommendations')
        .insert({
          patient_id: rec.patient_id,
          practitioner_id: rec.practitioner_id,
          title: `${rec.title} (Copy)`,
          diagnosis: rec.diagnosis,
          instructions: rec.instructions,
          duration_days: rec.duration_days,
          status: 'draft',
        })
        .select()
        .single();

      if (recError) throw recError;

      // Duplicate recommendation items
      if (rec.recommendation_items && rec.recommendation_items.length > 0) {
        const items = rec.recommendation_items.map((item: any) => ({
          recommendation_id: newRec.id,
          herb_id: item.herb_id,
          quantity: item.quantity,
          dosage_instructions: item.dosage_instructions,
          unit_price: item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from('recommendation_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      toast.success('Recommendation duplicated successfully');
      refetch();
    } catch (error) {
      logger.error('Error duplicating recommendation:', error);
      toast.error('Failed to duplicate recommendation');
    }
  };

  const handleDelete = async () => {
    if (!selectedRecommendation) return;
    
    try {
      setIsDeleting(true);
      
      // Delete recommendation items first
      const { error: itemsError } = await supabase
        .from('recommendation_items')
        .delete()
        .eq('recommendation_id', selectedRecommendation.id);

      if (itemsError) throw itemsError;

      // Delete recommendation
      const { error: recError } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', selectedRecommendation.id);

      if (recError) throw recError;

      toast.success('Recommendation deleted successfully');
      refetch();
      setIsDeleteOpen(false);
      setSelectedRecommendation(null);
    } catch (error) {
      logger.error('Error deleting recommendation:', error);
      toast.error('Failed to delete recommendation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePayNow = async (recommendationId: string) => {
    try {
      setLoadingCheckout(recommendationId);
      
      const { data, error } = await supabase.functions.invoke('generate-checkout-link', {
        body: { recommendation_id: recommendationId }
      });

      if (error) throw error;

      if (data?.checkout_url) {
        window.open(data.checkout_url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      logger.error('Error generating checkout link:', error);
      toast.error('Failed to generate checkout link. Please try again.');
    } finally {
      setLoadingCheckout(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Recommendations</h3>
          <Button onClick={() => setIsFormOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Recommendation
          </Button>
        </div>
        
        {recommendations.map((rec) => (
        <Card key={rec.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{rec.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>Created: {format(new Date(rec.created_at), 'MMM dd, yyyy')}</span>
                  {rec.sent_at && (
                    <>
                      <span>•</span>
                      <span>Sent: {format(new Date(rec.sent_at), 'MMM dd, yyyy')}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(rec.status || 'draft')}>
                  {rec.status || 'draft'}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedRecommendation(rec);
                        setIsSendOpen(true);
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {rec.status === 'sent' ? 'Resend' : 'Send'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedRecommendation(rec);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(rec)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setSelectedRecommendation(rec);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rec.diagnosis && (
              <div>
                <p className="text-sm font-medium mb-1">Diagnosis:</p>
                <p className="text-sm text-muted-foreground">{rec.diagnosis}</p>
              </div>
            )}

            {rec.recommendation_items && rec.recommendation_items.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Prescribed Herbs:</p>
                <div className="space-y-2">
                  {rec.recommendation_items.map((item: any) => (
                    <div key={item.id} className="pl-4 border-l-2 border-muted">
                      <p className="text-sm font-medium">
                        {item.herbs?.name} {item.herbs?.thai_name && `(${item.herbs.thai_name})`} - {item.quantity}g
                      </p>
                      {item.dosage_instructions && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.dosage_instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm">
              {rec.duration_days && (
                <div>
                  <span className="font-medium">Duration:</span>{' '}
                  <span className="text-muted-foreground">{rec.duration_days} days</span>
                </div>
              )}
              {rec.total_cost && (
                <div>
                  <span className="font-medium">Total:</span>{' '}
                  <span className="text-muted-foreground">฿{rec.total_cost.toFixed(2)}</span>
                </div>
              )}
            </div>

            {rec.instructions && (
              <div>
                <p className="text-sm font-medium mb-1">Instructions:</p>
                <p className="text-sm text-muted-foreground">{rec.instructions}</p>
              </div>
            )}

            {/* Pay Now section for patients */}
            {activeRole === 'patient' && (rec.status === 'sent' || rec.status === 'payment_pending') && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg space-y-2">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  {rec.status === 'payment_pending' ? 'Payment Required' : 'Ready for Checkout'}
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {rec.status === 'payment_pending' 
                    ? 'Your order is waiting for payment.'
                    : 'Your prescription is ready for checkout.'}
                </p>
                <Button 
                  onClick={() => handlePayNow(rec.id)}
                  disabled={loadingCheckout === rec.id}
                  className="w-full"
                  size="sm"
                >
                  {loadingCheckout === rec.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Pay Now
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        ))}
      </div>

      <RecommendationFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedRecommendation(null);
        }}
        defaultPatientId={patientId}
        recommendation={selectedRecommendation}
        onSuccess={() => {
          refetch();
          setIsFormOpen(false);
          setSelectedRecommendation(null);
        }}
      />

      {selectedRecommendation && (
        <SendRecommendationDialog
          recommendationId={selectedRecommendation.id}
          recommendationStatus={selectedRecommendation.status}
          sentAt={selectedRecommendation.sent_at}
          existingChannels={selectedRecommendation.notification_channels}
          open={isSendOpen}
          onOpenChange={(open) => {
            setIsSendOpen(open);
            if (!open) setSelectedRecommendation(null);
          }}
          onSuccess={() => {
            refetch();
            setIsSendOpen(false);
            setSelectedRecommendation(null);
          }}
        />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recommendation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedRecommendation?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRecommendation(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
