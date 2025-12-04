import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Pill, Plus, Send, Edit, Copy, Trash2, ExternalLink, Package, Clock, CheckCircle2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

interface OrdersTabProps {
  patientId: string;
}

export function OrdersTab({ patientId }: OrdersTabProps) {
  const { activeRole } = useRole();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  
  // Fetch recommendations (includes draft, sent, payment_pending)
  const { data: recommendations, isLoading: isLoadingRecs, refetch: refetchRecs } = useQuery({
    queryKey: ['patient-recommendations', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          recommendation_items(
            id,
            quantity,
            unit_price,
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

  // Fetch orders (paid recommendations with tracking info)
  const { data: orders, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['patient-orders', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          recommendations(
            id,
            title,
            diagnosis,
            instructions,
            recommendation_items(
              id,
              quantity,
              unit_price,
              dosage_instructions,
              herbs(name, thai_name)
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const isLoading = isLoadingRecs || isLoadingOrders;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Separate recommendations by status
  const draftRecs = recommendations?.filter(r => r.status === 'draft') || [];
  const pendingPaymentRecs = recommendations?.filter(r => r.status === 'sent' || r.status === 'payment_pending') || [];
  const completedOrders = orders || [];

  const hasAnyContent = draftRecs.length > 0 || pendingPaymentRecs.length > 0 || completedOrders.length > 0;

  if (!hasAnyContent) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This patient doesn't have any prescriptions or orders yet.
          </p>
          {activeRole !== 'patient' && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Prescription
            </Button>
          )}
        </div>

        <RecommendationFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          defaultPatientId={patientId}
          onSuccess={() => {
            refetchRecs();
            setIsFormOpen(false);
          }}
        />
      </>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
      case 'payment_pending':
        return 'default';
      case 'paid':
        return 'outline';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'paid':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleDuplicate = async (rec: any) => {
    try {
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

      toast.success('Prescription duplicated successfully');
      refetchRecs();
    } catch (error) {
      logger.error('Error duplicating prescription:', error);
      toast.error('Failed to duplicate prescription');
    }
  };

  const handleDelete = async () => {
    if (!selectedRecommendation) return;
    
    try {
      setIsDeleting(true);
      
      const { error: itemsError } = await supabase
        .from('recommendation_items')
        .delete()
        .eq('recommendation_id', selectedRecommendation.id);

      if (itemsError) throw itemsError;

      const { error: recError } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', selectedRecommendation.id);

      if (recError) throw recError;

      toast.success('Prescription deleted successfully');
      refetchRecs();
      setIsDeleteOpen(false);
      setSelectedRecommendation(null);
    } catch (error) {
      logger.error('Error deleting prescription:', error);
      toast.error('Failed to delete prescription');
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

  const handleReorder = async (order: any) => {
    try {
      if (!order.recommendations) {
        toast.error('Cannot reorder: No recommendation data found');
        return;
      }

      const rec = order.recommendations;
      
      const { data: newRec, error: recError } = await supabase
        .from('recommendations')
        .insert({
          patient_id: patientId,
          practitioner_id: rec.practitioner_id,
          title: `Re-order: ${rec.title}`,
          diagnosis: rec.diagnosis,
          instructions: rec.instructions,
          duration_days: rec.duration_days,
          status: 'draft',
        })
        .select()
        .single();

      if (recError) throw recError;

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

      toast.success('Reorder created as draft prescription');
      refetchRecs();
    } catch (error) {
      logger.error('Error reordering:', error);
      toast.error('Failed to create reorder');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Orders & Prescriptions</h3>
          {activeRole !== 'patient' && (
            <Button onClick={() => setIsFormOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Prescription
            </Button>
          )}
        </div>

        {/* Draft Prescriptions Section */}
        {draftRecs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-muted-foreground" />
              <h4 className="text-md font-semibold">Draft Prescriptions</h4>
              <Badge variant="secondary">{draftRecs.length}</Badge>
            </div>
            {draftRecs.map((rec) => (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        Created: {format(new Date(rec.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(rec.status)}>draft</Badge>
                      {activeRole !== 'patient' && (
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
                              Send to Patient
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
                      )}
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

                  {rec.instructions && (
                    <div>
                      <p className="text-sm font-medium mb-1">Instructions:</p>
                      <p className="text-sm text-muted-foreground">{rec.instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {draftRecs.length > 0 && (pendingPaymentRecs.length > 0 || completedOrders.length > 0) && (
          <Separator />
        )}

        {/* Pending Payment Section */}
        {pendingPaymentRecs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <h4 className="text-md font-semibold">Awaiting Payment</h4>
              <Badge variant="default">{pendingPaymentRecs.length}</Badge>
            </div>
            {pendingPaymentRecs.map((rec) => (
              <Card key={rec.id} className="border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>Sent: {format(new Date(rec.sent_at!), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(rec.status)}>
                        {rec.status === 'sent' ? 'sent' : 'payment pending'}
                      </Badge>
                      {activeRole !== 'patient' && (
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
                              Resend
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(rec)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rec.recommendation_items && rec.recommendation_items.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Prescribed Herbs:</p>
                      <div className="space-y-2">
                        {rec.recommendation_items.map((item: any) => (
                          <div key={item.id} className="pl-4 border-l-2 border-muted">
                            <p className="text-sm font-medium">
                              {item.herbs?.name} {item.herbs?.thai_name && `(${item.herbs.thai_name})`} - {item.quantity}g
                            </p>
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

                  {/* Pay Now section */}
                  {activeRole === 'patient' && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        Payment Required
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        Your prescription is ready for checkout.
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
        )}

        {pendingPaymentRecs.length > 0 && completedOrders.length > 0 && <Separator />}

        {/* Completed Orders Section */}
        {completedOrders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h4 className="text-md font-semibold">Order History</h4>
              <Badge variant="outline">{completedOrders.length}</Badge>
            </div>
            {completedOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {order.recommendations?.title || 'Order'}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>Ordered: {format(new Date(order.created_at), 'MMM dd, yyyy')}</span>
                        <span>•</span>
                        <span>฿{order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={getOrderStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.recommendations?.recommendation_items && order.recommendations.recommendation_items.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Items:</p>
                      <div className="space-y-2">
                        {order.recommendations.recommendation_items.map((item: any) => (
                          <div key={item.id} className="pl-4 border-l-2 border-muted">
                            <p className="text-sm">
                              {item.herbs?.name} {item.herbs?.thai_name && `(${item.herbs.thai_name})`} - {item.quantity}g
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.tracking_number && (
                    <div>
                      <p className="text-sm font-medium mb-1">Tracking:</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{order.tracking_number}</p>
                        {order.courier_tracking_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(order.courier_tracking_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {order.shipping_address && (
                    <div>
                      <p className="text-sm font-medium mb-1">Shipping Address:</p>
                      <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                    </div>
                  )}

                  {order.status === 'delivered' && activeRole === 'patient' && (
                    <Button 
                      onClick={() => handleReorder(order)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Reorder
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
          refetchRecs();
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
            refetchRecs();
            setIsSendOpen(false);
            setSelectedRecommendation(null);
          }}
        />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
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
