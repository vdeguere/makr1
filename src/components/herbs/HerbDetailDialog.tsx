import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Package, AlertCircle, Pencil } from 'lucide-react';

interface Herb {
  id: string;
  name: string;
  thai_name: string | null;
  scientific_name: string | null;
  description: string | null;
  properties: string | null;
  dosage_instructions: string | null;
  contraindications: string | null;
  stock_quantity: number | null;
  cost_per_unit: number | null;
  retail_price: number | null;
  image_url: string | null;
  category_id: string | null;
  brand: string | null;
  certifications: string[] | null;
  subscription_enabled?: boolean | null;
  subscription_discount_percentage?: number | null;
  subscription_intervals?: string[] | null;
  product_categories?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

interface HerbDetailDialogProps {
  herb: Herb | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayPrice: number | null;
  userRole: string | null;
  onEdit?: () => void;
}

export function HerbDetailDialog({ herb, open, onOpenChange, displayPrice, userRole, onEdit }: HerbDetailDialogProps) {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [herb?.id]);

  if (!herb) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{herb.name}</DialogTitle>
          {herb.thai_name && (
            <DialogDescription className="text-base">{herb.thai_name}</DialogDescription>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {herb.product_categories && (
              <Badge variant="secondary">{herb.product_categories.name}</Badge>
            )}
            {herb.brand && (
              <Badge variant="outline">{herb.brand}</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {herb.image_url && !imageError ? (
            <img
              src={herb.image_url}
              alt={herb.name}
              className="w-full h-64 object-cover rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-muted rounded-lg">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {herb.scientific_name && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Scientific Name</h3>
              <p className="text-sm italic">{herb.scientific_name}</p>
            </div>
          )}

          {herb.certifications && herb.certifications.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {herb.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline">{cert}</Badge>
                ))}
              </div>
            </div>
          )}

          {herb.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm">{herb.description}</p>
            </div>
          )}

          {herb.properties && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Properties</h3>
              <p className="text-sm">{herb.properties}</p>
            </div>
          )}

          {herb.dosage_instructions && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Dosage Instructions</h3>
              <p className="text-sm">{herb.dosage_instructions}</p>
            </div>
          )}

          {herb.contraindications && (
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-destructive mb-1">Contraindications</h3>
                  <p className="text-sm text-destructive">{herb.contraindications}</p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Stock Quantity</h3>
              <p className="text-lg font-semibold">{herb.stock_quantity ?? 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Price</h3>
              {displayPrice ? (
                <Badge variant="outline" className="text-lg font-semibold">
                  ฿{Number(displayPrice).toFixed(2)}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">N/A</p>
              )}
            </div>
          </div>

          {(userRole === 'admin' || userRole === 'dev') && herb.cost_per_unit && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Cost Price</h3>
            <p className="text-sm text-muted-foreground">฿{Number(herb.cost_per_unit).toFixed(2)}</p>
          </div>
        )}

        {/* Subscription Pricing */}
        {herb.subscription_enabled && herb.subscription_discount_percentage && displayPrice && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Subscribe & Save</Badge>
              <span className="text-xs font-medium text-green-600">
                {herb.subscription_discount_percentage}% off
              </span>
            </div>
            
            <div>
              <p className="text-lg font-bold text-green-600">
                ฿{(displayPrice * (1 - herb.subscription_discount_percentage / 100)).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                with subscription
              </p>
            </div>
            
            {herb.subscription_intervals && herb.subscription_intervals.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {herb.subscription_intervals.map(interval => (
                  <Badge key={interval} variant="outline" className="text-xs">
                    {interval.charAt(0).toUpperCase() + interval.slice(1)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {userRole === 'admin' && onEdit && (
        <DialogFooter>
          <Button onClick={onEdit} className="w-full">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        </DialogFooter>
      )}
      </DialogContent>
    </Dialog>
  );
}
