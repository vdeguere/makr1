import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CheckoutData {
  recommendation: {
    title: string;
    diagnosis: string | null;
    instructions: string | null;
    total_cost: number;
    patients: { 
      full_name: string;
      default_shipping_address: string | null;
      default_shipping_city: string | null;
      default_shipping_postal_code: string | null;
      default_shipping_phone: string | null;
    };
    profiles: { full_name: string };
  };
  items: Array<{
    quantity: number;
    dosage_instructions: string | null;
    unit_price: number;
    herbs: { name: string; thai_name: string | null };
  }>;
}

export default function Checkout() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackViewItem, trackBeginCheckout, trackException } = useAnalytics();
  const { currency, formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_phone: '',
    payment_method: 'promptpay',
  });

  useEffect(() => {
    if (token) {
      validateAndFetchCheckout();
    }
  }, [token]);

  const validateAndFetchCheckout = async () => {
    try {
      const { data: link, error: linkError } = await supabase
        .from('recommendation_links')
        .select(`
          id,
          used_at,
          expires_at,
          recommendations(
            title,
            diagnosis,
            instructions,
            total_cost,
            patients(
              full_name,
              default_shipping_address,
              default_shipping_city,
              default_shipping_postal_code,
              default_shipping_phone
            ),
            profiles!recommendations_practitioner_id_fkey(full_name),
            recommendation_items(
              quantity,
              dosage_instructions,
              unit_price,
              herbs(name, thai_name)
            )
          )
        `)
        .eq('token', token)
        .single();

      if (linkError || !link) {
        setError('Invalid checkout link');
        return;
      }

      if (link.used_at) {
        setError('This checkout link has already been used');
        return;
      }

      if (new Date(link.expires_at) < new Date()) {
        setError('This checkout link has expired');
        return;
      }

      const recommendation = link.recommendations;
      if (!recommendation || !recommendation.recommendation_items || recommendation.recommendation_items.length === 0) {
        setError('No items found in this prescription');
        return;
      }

      setCheckoutData({
        recommendation: {
          title: recommendation.title,
          diagnosis: recommendation.diagnosis,
          instructions: recommendation.instructions,
          total_cost: recommendation.total_cost,
          patients: recommendation.patients,
          profiles: recommendation.profiles,
        },
        items: recommendation.recommendation_items,
      });

      // Pre-fill form with saved shipping information if available
      if (recommendation.patients) {
        setFormData({
          shipping_address: recommendation.patients.default_shipping_address || '',
          shipping_city: recommendation.patients.default_shipping_city || '',
          shipping_postal_code: recommendation.patients.default_shipping_postal_code || '',
          shipping_phone: recommendation.patients.default_shipping_phone || '',
          payment_method: 'promptpay',
        });
      }

      // Track view_item event
      trackViewItem(
        recommendation.total_cost,
        'THB',
        recommendation.recommendation_items.map((item: any, index: number) => ({
          item_id: `herb_${index}`,
          item_name: item.herbs.name,
          item_category: 'herbal_medicine',
          price: item.unit_price,
          quantity: item.quantity,
        }))
      );
    } catch (error) {
      console.error('Error validating checkout:', error);
      setError('Failed to load checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.shipping_address || !formData.shipping_city || !formData.shipping_phone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Track begin_checkout event
      trackBeginCheckout(
        checkoutData.recommendation.total_cost,
        'THB',
        checkoutData.items.map((item, index) => ({
          item_id: `herb_${index}`,
          item_name: item.herbs.name,
          item_category: 'herbal_medicine',
          price: item.unit_price,
          quantity: item.quantity,
        }))
      );

      // If PromptPay is selected, use Stripe checkout
      if (formData.payment_method === 'promptpay') {
        const { data, error } = await supabase.functions.invoke('create-stripe-checkout-session', {
          body: {
            token,
            currency,
            shipping_address: formData.shipping_address,
            shipping_city: formData.shipping_city,
            shipping_postal_code: formData.shipping_postal_code,
            shipping_phone: formData.shipping_phone,
          },
        });

        if (error) throw error;

        if (data.error) {
          throw new Error(data.error);
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        // Use existing direct order creation flow
        const { data, error } = await supabase.functions.invoke('create-order-from-checkout', {
          body: {
            token,
            ...formData,
          },
        });

        if (error) throw error;

        if (data.error) {
          throw new Error(data.error);
        }

        toast({
          title: 'Success',
          description: 'Your order has been placed successfully!',
        });

        // Navigate to success page or show success message
        navigate(`/order-confirmation/${data.order_id}`);
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Track checkout error in GA4
      trackException('checkout_failed', false);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to create order',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Checkout Unavailable</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4 w-full" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!checkoutData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Order</CardTitle>
            <CardDescription>
              Prescription from {checkoutData.recommendation.profiles.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recommendation Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{checkoutData.recommendation.title}</h3>
              
              {checkoutData.recommendation.diagnosis && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">Diagnosis</p>
                  <p className="text-sm text-muted-foreground">{checkoutData.recommendation.diagnosis}</p>
                </div>
              )}

              {checkoutData.recommendation.instructions && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">Instructions</p>
                  <p className="text-sm text-muted-foreground">{checkoutData.recommendation.instructions}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h3 className="font-semibold">Prescribed Herbs</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Herb</th>
                      <th className="text-left p-3">Quantity</th>
                      <th className="text-right p-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkoutData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">
                          {item.herbs.name}
                          {item.herbs.thai_name && (
                            <span className="text-muted-foreground"> ({item.herbs.thai_name})</span>
                          )}
                        </td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3 text-right">
                          {formatPrice(item.unit_price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-semibold">
                    <tr>
                      <td colSpan={2} className="p-3 text-right">Total:</td>
                      <td className="p-3 text-right text-lg">
                        {formatPrice(checkoutData.recommendation.total_cost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Form */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <Input
                  id="address"
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  placeholder="Street address, building, apt/unit number"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.shipping_city}
                    onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input
                    id="postal"
                    value={formData.shipping_postal_code}
                    onChange={(e) => setFormData({ ...formData, shipping_postal_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.shipping_phone}
                  onChange={(e) => setFormData({ ...formData, shipping_phone: e.target.value })}
                  placeholder="+1234567890"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <RadioGroup value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="promptpay" id="promptpay" />
                    <Label htmlFor="promptpay" className="cursor-pointer">PromptPay (QR Code)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash_on_delivery" id="cod" />
                    <Label htmlFor="cod" className="cursor-pointer">Cash on Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank_transfer" id="bank" />
                    <Label htmlFor="bank" className="cursor-pointer">Bank Transfer</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Order - ฿{checkoutData.recommendation.total_cost.toFixed(2)}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}