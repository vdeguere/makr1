import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/lib/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import { logger } from '@/lib/logger';

interface ProductCardProps {
  productId: string;
}

interface ProductData {
  id: string;
  name: string;
  thai_name: string | null;
  retail_price: number;
  price_currency: string;
  subscription_enabled: boolean;
  subscription_discount_percentage: number | null;
  stock_quantity: number | null;
  image_url: string | null;
  images: any | null;
}

export const ProductCard = ({ productId }: ProductCardProps) => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currency } = useCurrency();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('herbs')
          .select('id, name, thai_name, retail_price, price_currency, subscription_enabled, subscription_discount_percentage, stock_quantity, image_url, images')
          .eq('id', productId)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (err) {
        logger.error('Error fetching product:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <Card className="w-full max-w-[280px] p-3 space-y-2">
        <Skeleton className="w-full aspect-[4/3] rounded-md" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </Card>
    );
  }

  if (error || !product) {
    return (
      <Card className="w-full max-w-[280px] p-3 text-muted-foreground text-sm">
        {t('chat.productCard.productNotFound')}
      </Card>
    );
  }

  const displayName = product.thai_name 
    ? `${product.name} (${product.thai_name})` 
    : product.name;

  // Get primary image from image_url or images array
  let primaryImage = product.image_url;
  if (!primaryImage && product.images && Array.isArray(product.images) && product.images.length > 0) {
    primaryImage = product.images[0];
  }

  const inStock = product.stock_quantity === null || product.stock_quantity > 0;

  const handleClick = () => {
    navigate(`/dashboard/herbs/${product.id}`);
  };

  return (
    <Card 
      className="w-full max-w-[280px] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {primaryImage ? (
          <img 
            src={primaryImage} 
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {product.name.charAt(0)}
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive">{t('chat.productCard.outOfStock')}</Badge>
          </div>
        )}
      </div>
      
      <div className="p-3 space-y-2">
        <h4 className="font-semibold text-sm line-clamp-2">{displayName}</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-lg font-bold">
              {formatPrice(product.retail_price, currency)}
            </p>
            {product.subscription_enabled && product.subscription_discount_percentage && (
              <Badge variant="secondary" className="text-xs">
                {t('chat.productCard.subscribeAndSave')} {product.subscription_discount_percentage}%
              </Badge>
            )}
          </div>
          
          {inStock && (
            <Badge variant="outline" className="text-xs">
              {t('chat.productCard.inStock')}
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-primary hover:underline">
          {t('chat.productCard.viewDetails')} →
        </p>
      </div>
    </Card>
  );
};
