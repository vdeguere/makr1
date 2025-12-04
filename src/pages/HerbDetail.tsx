import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useRole } from '@/contexts/RoleContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Package, AlertCircle, Pencil, Trash2, Info, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HerbFormDialog } from '@/components/herbs/HerbFormDialog';
import { logAudit } from '@/lib/auditLog';
import { logger } from '@/lib/logger';
import { ProductReviewSection } from '@/components/products/ProductReviewSection';
import { StarRating } from '@/components/products/StarRating';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { ImageCarousel } from '@/components/products/ImageCarousel';

interface ProductImage {
  url: string;
  isPrimary: boolean;
  order: number;
  caption?: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

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
  commission_rate: number | null;
  image_url: string | null;
  images?: ProductImage[] | null;
  category_id: string | null;
  brand: string | null;
  certifications: string[] | null;
  required_certification_id?: string | null;
  required_course_id?: string | null;
  safety_waiver_required?: boolean | null;
  product_categories?: Category | null;
  average_rating?: number | null;
  review_count?: number | null;
  subscription_enabled?: boolean | null;
  subscription_discount_percentage?: number | null;
  subscription_intervals?: string[] | null;
}

export default function HerbDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  const { activeRole, role: devRole } = useRole();
  const { toast } = useToast();
  const [herb, setHerb] = useState<Herb | null>(null);
  const [loading, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasRequiredCertification, setHasRequiredCertification] = useState<boolean | null>(null);
  const [hasCompletedRequiredCourse, setHasCompletedRequiredCourse] = useState<boolean | null>(null);
  const [requiredCourseName, setRequiredCourseName] = useState<string | null>(null);
  const [checkingCertification, setCheckingCertification] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHerb();
    }
  }, [id]);

  useEffect(() => {
    if (herb?.required_certification_id && user?.id && activeRole === 'patient') {
      checkCertification();
    } else if (!herb?.required_certification_id) {
      setHasRequiredCertification(true); // No restriction
    }
  }, [herb?.required_certification_id, user?.id, activeRole]);

  useEffect(() => {
    if (herb?.required_course_id && user?.id && activeRole === 'patient') {
      checkCourseCompletion();
    } else if (!herb?.required_course_id) {
      setHasCompletedRequiredCourse(true); // No restriction
    }
  }, [herb?.required_course_id, user?.id, activeRole]);

  const fetchHerb = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('herbs')
        .select(`
          *,
          product_categories (
            id,
            name,
            description
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const typedData = {
        ...data,
        certifications: Array.isArray(data.certifications) ? data.certifications as string[] : null,
        images: Array.isArray(data.images) ? data.images as unknown as ProductImage[] : null
      } as Herb;

      setHerb(typedData);
    } catch (error) {
      logger.error('Error fetching herb:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
      navigate('/dashboard/herbs');
    } finally {
      setLoading(false);
    }
  };

  const checkCourseCompletion = async () => {
    if (!herb?.required_course_id || !user?.id) return;

    try {
      // Get course name
      const { data: course } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', herb.required_course_id)
        .single();

      if (course) {
        setRequiredCourseName(course.title);
      }

      // Check if user has completed the course
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('completion_percentage')
        .eq('course_id', herb.required_course_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (enrollment && enrollment.completion_percentage === 100) {
        setHasCompletedRequiredCourse(true);
      } else {
        setHasCompletedRequiredCourse(false);
      }
    } catch (error) {
      logger.error('Error checking course completion:', error);
      setHasCompletedRequiredCourse(null);
    }
  };

  const checkCertification = async () => {
    if (!herb?.required_certification_id || !user?.id) return;

    setCheckingCertification(true);
    try {
      // Check if user has the required certification
      const { data: certification } = await supabase
        .from('user_certifications')
        .select('certificate_id, certificate:course_certificates(course_id, course:courses(title))')
        .eq('user_id', user.id)
        .eq('certificate_id', herb.required_certification_id)
        .maybeSingle();

      if (certification) {
        setHasRequiredCertification(true);
      } else {
        setHasRequiredCertification(false);
        // Get course name for display
        const { data: certData } = await supabase
          .from('course_certificates')
          .select('course_id, course:courses(title)')
          .eq('id', herb.required_certification_id)
          .single();

        if (certData?.course) {
          setRequiredCourseName(certData.course.title);
        }
      }
    } catch (error) {
      logger.error('Error checking certification:', error);
      setHasRequiredCertification(null);
    } finally {
      setCheckingCertification(false);
    }
  };

  const getDisplayPrice = (herb: Herb) => {
    // Always return retail_price as the main display price
    return herb.retail_price;
  };

  const getProductImages = (herb: Herb) => {
    if (herb.images && herb.images.length > 0) {
      return herb.images.sort((a, b) => a.order - b.order);
    }
    if (herb.image_url) {
      return [{ url: herb.image_url, caption: null }];
    }
    return [];
  };

  const handleFormSuccess = () => {
    fetchHerb();
    setFormDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!herb) return;

    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('herbs')
        .delete()
        .eq('id', herb.id);

      if (error) {
        if (error.code === '23503') {
          toast({
            title: 'Cannot Delete Product',
            description: 'This product is referenced in existing recommendations or orders. Please remove those references first.',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      await logAudit({
        action: 'herb_deleted',
        recordType: 'herb',
        recordId: herb.id,
        details: {
          name: herb.name,
          category_id: herb.category_id,
        },
      });

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      navigate('/dashboard/herbs');
    } catch (error) {
      logger.error('Error deleting herb:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-64 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!herb) return null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button and Edit Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/herbs')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          {(activeRole === 'admin' || activeRole === 'dev') && (
            <div className="flex gap-2">
              <Button onClick={() => setFormDialogOpen(true)} variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
              <Button 
                onClick={() => setDeleteDialogOpen(true)} 
                variant="destructive"
                size="sm"
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Product Images Carousel */}
          <div className="relative">
            {herb.stock_quantity !== null && herb.stock_quantity <= 50 && (
              <Badge 
                variant={herb.stock_quantity === 0 ? 'destructive' : 'secondary'}
                className="absolute top-4 left-4 z-10"
              >
                {herb.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
              </Badge>
            )}
            
            {/* Lock Overlay for Gated Products */}
            {(activeRole === 'patient' && 
              ((herb?.required_certification_id && hasRequiredCertification === false) ||
               (herb?.required_course_id && hasCompletedRequiredCourse === false))) && (
              <div className="absolute inset-0 bg-black/60 rounded-lg z-20 flex items-center justify-center">
                <div className="text-center text-white space-y-2">
                  <Lock className="h-12 w-12 mx-auto" />
                  <p className="font-semibold">Locked</p>
                  {herb?.required_course_id && hasCompletedRequiredCourse === false && (
                    <p className="text-sm">Must complete: {requiredCourseName || 'Required Course'}</p>
                  )}
                  {herb?.required_certification_id && hasRequiredCertification === false && (
                    <p className="text-sm">Requires certification</p>
                  )}
                </div>
              </div>
            )}
            
            {getProductImages(herb).length > 0 ? (
              <ImageCarousel 
                images={getProductImages(herb)}
                productName={herb.name}
              />
            ) : (
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-6">
            {/* Product Title */}
            <div className="space-y-2">
              <h1 className="text-4xl font-serif tracking-tight">{herb.name}</h1>
              {herb.thai_name && (
                <p className="text-xl text-muted-foreground">{herb.thai_name}</p>
              )}
              {herb.scientific_name && (
                <p className="text-sm italic text-muted-foreground">{herb.scientific_name}</p>
              )}
              
              {/* Rating Display */}
              {herb.average_rating && herb.average_rating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating 
                    rating={herb.average_rating} 
                    size="md" 
                    showCount 
                    reviewCount={herb.review_count || 0}
                  />
                  <span className="text-lg font-medium">
                    {herb.average_rating.toFixed(1)} out of 5
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="text-4xl font-bold">฿{Number(getDisplayPrice(herb)).toFixed(2)}</div>
              {(activeRole === 'admin' || activeRole === 'dev') && herb.cost_per_unit && (
                <p className="text-sm text-muted-foreground">
                  Cost Price: ฿{Number(herb.cost_per_unit).toFixed(2)}
                </p>
              )}
              {(activeRole === 'admin' || activeRole === 'practitioner') && herb.commission_rate && (
                <p className="text-sm text-muted-foreground">
                  Commission Rate: {(herb.commission_rate * 100).toFixed(0)}%
                </p>
              )}
            </div>

            {/* Subscription Pricing */}
            {herb.subscription_enabled && herb.subscription_discount_percentage && (
              <div className="space-y-3 border-t pt-4 mt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Subscribe & Save</Badge>
                  <span className="text-sm font-medium text-green-600">
                    {herb.subscription_discount_percentage}% off
                  </span>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    ฿{(getDisplayPrice(herb) * (1 - herb.subscription_discount_percentage / 100)).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    with subscription
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Available frequencies:</p>
                  <div className="flex flex-wrap gap-2">
                    {(herb.subscription_intervals || []).map(interval => (
                      <Badge key={interval} variant="outline">
                        {interval.charAt(0).toUpperCase() + interval.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stock Status */}
            {herb.stock_quantity !== null && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Stock:</span>
                <span className={herb.stock_quantity === 0 ? 'text-destructive' : 'text-muted-foreground'}>
                  {herb.stock_quantity === 0 ? 'Out of Stock' : `${herb.stock_quantity} units available`}
                </span>
              </div>
            )}

            {/* Category and Brand Tags */}
            <div className="flex flex-wrap gap-2">
              {herb.product_categories && (
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  {herb.product_categories.name}
                </Badge>
              )}
              {herb.brand && (
                <Badge variant="outline" className="text-sm py-1 px-3">
                  {herb.brand}
                </Badge>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Patient Notice */}
            {activeRole === 'patient' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This product is available through practitioner recommendation only. 
                  Please consult with your practitioner to include this in your treatment plan.
                </AlertDescription>
              </Alert>
            )}

            {/* Accordion Sections */}
            <Accordion type="multiple" defaultValue={["description"]} className="w-full">
              {/* Description Section */}
              {herb.description && (
                <AccordionItem value="description" className="border-t">
                  <AccordionTrigger className="text-xl font-serif hover:no-underline py-6">
                    Description
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    {herb.description}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Item Details Section */}
              <AccordionItem value="item-details" className="border-t">
                <AccordionTrigger className="text-xl font-serif hover:no-underline py-6">
                  Item Details
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  {herb.scientific_name && (
                    <div>
                      <p className="text-sm font-medium mb-1">Scientific Name</p>
                      <p className="text-muted-foreground italic">{herb.scientific_name}</p>
                    </div>
                  )}
                  
                  {herb.product_categories && (
                    <div>
                      <p className="text-sm font-medium mb-1">Category</p>
                      <Badge variant="secondary">{herb.product_categories.name}</Badge>
                    </div>
                  )}
                  
                  {herb.brand && (
                    <div>
                      <p className="text-sm font-medium mb-1">Brand</p>
                      <p className="text-muted-foreground">{herb.brand}</p>
                    </div>
                  )}
                  
                  {herb.stock_quantity !== null && (
                    <div>
                      <p className="text-sm font-medium mb-1">Stock Status</p>
                      <p className="text-muted-foreground">{herb.stock_quantity} units available</p>
                    </div>
                  )}
                  
                  {herb.certifications && herb.certifications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {herb.certifications.map((cert, index) => (
                          <Badge key={index} variant="secondary">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {herb.properties && (
                    <div>
                      <p className="text-sm font-medium mb-1">Properties & Benefits</p>
                      <p className="text-muted-foreground leading-relaxed">{herb.properties}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Care Guidelines Section */}
              {herb.dosage_instructions && (
                <AccordionItem value="care-guidelines" className="border-t">
                  <AccordionTrigger className="text-xl font-serif hover:no-underline py-6">
                    Care Guidelines
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    {herb.dosage_instructions}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Natural Variation Disclaimer Section */}
              {herb.contraindications && (
                <AccordionItem value="natural-variation" className="border-t border-b">
                  <AccordionTrigger className="text-xl font-serif hover:no-underline py-6">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      Natural Variation Disclaimer
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-sm text-destructive/90 leading-relaxed">{herb.contraindications}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-12">
          <ProductReviewSection 
            herbId={herb.id} 
            averageRating={herb.average_rating || 0}
            reviewCount={herb.review_count || 0}
            userRole={activeRole}
          />
        </div>

        {/* Breadcrumb at Bottom */}
        <div className="pt-4 border-t">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/herbs">Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{herb.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <HerbFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSuccess={handleFormSuccess}
        herb={herb}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{herb?.name}"? This action cannot be undone.
              {herb?.stock_quantity && herb.stock_quantity > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This product has {herb.stock_quantity} units in stock.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
