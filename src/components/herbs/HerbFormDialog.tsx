import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { herbSchema, type HerbFormData } from '@/lib/validations/herb';
import { Loader2, AlertTriangle, Package, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { logAudit } from '@/lib/auditLog';
import { logger } from '@/lib/logger';
import { ImageUploadManager } from '@/components/products/ImageUploadManager';

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  url: string;
  isPrimary: boolean;
  order: number;
  caption?: string | null;
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
  cost_per_unit: number | null;
  retail_price: number | null;
  commission_rate: number | null;
  stock_quantity: number | null;
  image_url: string | null;
  images?: ProductImage[] | null;
  category_id: string | null;
  brand: string | null;
  certifications: string[] | null;
  subscription_enabled?: boolean | null;
  subscription_discount_percentage?: number | null;
  subscription_intervals?: string[] | null;
}

interface HerbFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  herb?: Herb | null;
}

export function HerbFormDialog({ open, onOpenChange, onSuccess, herb }: HerbFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [courses, setCourses] = React.useState<Array<{ id: string; title: string }>>([]);
  const [certificationInput, setCertificationInput] = React.useState('');
  const [productImages, setProductImages] = React.useState<ProductImage[]>([]);
  const [formData, setFormData] = React.useState<Partial<HerbFormData>>({
    name: '',
    thai_name: '',
    scientific_name: '',
    description: '',
    properties: '',
    dosage_instructions: '',
    contraindications: '',
    cost_per_unit: undefined,
    retail_price: undefined,
    commission_rate: 0.10,
    stock_quantity: 0,
    image_url: '',
    images: [],
    category_id: undefined,
    brand: '',
    certifications: [],
    subscription_enabled: false,
    subscription_discount_percentage: undefined,
    subscription_intervals: ['monthly'],
    required_course_id: undefined,
  });

  const isEditMode = !!herb;

  React.useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      logger.error('Error fetching courses:', error);
    }
  };

  React.useEffect(() => {
    if (herb) {
      setFormData({
        name: herb.name,
        thai_name: herb.thai_name || '',
        scientific_name: herb.scientific_name || '',
        description: herb.description || '',
        properties: herb.properties || '',
        dosage_instructions: herb.dosage_instructions || '',
        contraindications: herb.contraindications || '',
        cost_per_unit: herb.cost_per_unit || undefined,
        retail_price: herb.retail_price || undefined,
        commission_rate: herb.commission_rate || 0.10,
        stock_quantity: herb.stock_quantity || 0,
        image_url: herb.image_url || '',
        images: herb.images || [],
        category_id: herb.category_id || undefined,
        brand: herb.brand || '',
        certifications: herb.certifications || [],
        subscription_enabled: herb.subscription_enabled || false,
        subscription_discount_percentage: herb.subscription_discount_percentage || undefined,
        subscription_intervals: (herb.subscription_intervals as any) || ['monthly'],
        required_course_id: (herb as any).required_course_id || undefined,
      });
      
      // Load existing images or create from image_url
      if (herb.images && herb.images.length > 0) {
        setProductImages(herb.images);
      } else if (herb.image_url) {
        setProductImages([{
          url: herb.image_url,
          isPrimary: true,
          order: 0,
          caption: null
        }]);
      } else {
        setProductImages([]);
      }
    } else {
      setFormData({
        name: '',
        thai_name: '',
        scientific_name: '',
        description: '',
        properties: '',
        dosage_instructions: '',
        contraindications: '',
        cost_per_unit: undefined,
        retail_price: undefined,
        commission_rate: 0.10,
        stock_quantity: 0,
        image_url: '',
        images: [],
        category_id: undefined,
        brand: '',
        certifications: []
      });
      setProductImages([]);
    }
  }, [herb, open]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('product_categories')
      .select('id, name')
      .order('name');
    if (data) setCategories(data);
  };

  const handleMultipleImageUpload = async (files: FileList) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const uploadedImages: ProductImage[] = [];
    
    setUploadingImages(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!validTypes.includes(file.type)) {
          toast({
            variant: 'destructive',
            title: 'Invalid file type',
            description: `${file.name}: Please upload JPEG, PNG, WebP, or GIF images`
          });
          continue;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            variant: 'destructive',
            title: 'File too large',
            description: `${file.name} must be less than 5MB`
          });
          continue;
        }
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        uploadedImages.push({
          url: publicUrl,
          isPrimary: productImages.length === 0 && i === 0, // First image is primary if no images exist
          order: productImages.length + i,
          caption: null
        });
      }
      
      if (uploadedImages.length > 0) {
        setProductImages([...productImages, ...uploadedImages]);
        toast({
          title: 'Success',
          description: `${uploadedImages.length} image(s) uploaded successfully`
        });
      }
    } catch (error: any) {
      logger.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload images'
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get primary image for backward compatibility
      const primaryImage = productImages.find(img => img.isPrimary) || productImages[0];
      
      // Prepare data for database
      const dbData: any = {
        name: formData.name || '',
        thai_name: formData.thai_name || null,
        scientific_name: formData.scientific_name || null,
        description: formData.description || null,
        properties: formData.properties || null,
        dosage_instructions: formData.dosage_instructions || null,
        contraindications: formData.contraindications || null,
        cost_per_unit: formData.cost_per_unit || null,
        retail_price: formData.retail_price || null,
        commission_rate: formData.commission_rate || null,
        stock_quantity: formData.stock_quantity ?? 0,
        image_url: primaryImage?.url || null, // Backward compatibility
        images: productImages.length > 0 ? JSON.parse(JSON.stringify(productImages)) : null,
        category_id: formData.category_id || null,
        brand: formData.brand || null,
        certifications: formData.certifications || null,
        required_certification_id: (formData as any).required_certification_id || null,
        required_course_id: (formData as any).required_course_id || null,
        safety_waiver_required: (formData as any).safety_waiver_required || false,
      };

      // Validate form data
      herbSchema.parse(dbData);

      if (isEditMode && herb) {
        // Update existing herb
        const { error } = await supabase
          .from('herbs')
          .update(dbData)
          .eq('id', herb.id);

        if (error) throw error;

        // Log audit
        await logAudit({
          action: 'patient_updated',
          recordType: 'herb',
          recordId: herb.id,
          details: { updated_fields: Object.keys(dbData) }
        });

        toast({
          title: 'Success',
          description: 'Product updated successfully'
        });
      } else {
        // Create new herb
        const { error } = await supabase
          .from('herbs')
          .insert([dbData]);

        if (error) throw error;

        // Log audit
        await logAudit({
          action: 'patient_created',
          recordType: 'herb',
          details: { name: dbData.name }
        });

        toast({
          title: 'Success',
          description: 'Product created successfully'
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      logger.error('Error saving herb:', error);
      
      if (error.errors) {
        // Zod validation errors
        const firstError = error.errors[0];
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: firstError.message
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to save product'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Product' : 'Create New Product'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the product information below.' : 'Fill in the details to create a new product.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">English Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2 hidden">
              <Label htmlFor="thai_name">Thai Name</Label>
              <Input
                id="thai_name"
                value={formData.thai_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, thai_name: e.target.value }))}
                placeholder="Enter Thai name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category_id || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  category_id: value === 'none' ? undefined : value 
                }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Enter brand name"
              />
            </div>
          </div>

          <div className="space-y-2 hidden">
            <Label htmlFor="scientific_name">Scientific Name</Label>
            <Input
              id="scientific_name"
              value={formData.scientific_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, scientific_name: e.target.value }))}
              placeholder="Enter scientific name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="properties">Keywords</Label>
            <Textarea
              id="properties"
              value={(() => {
                if (!formData.properties) return '';
                try {
                  const parsed = JSON.parse(formData.properties);
                  return parsed.keywords || '';
                } catch {
                  return formData.properties;
                }
              })()}
              onChange={(e) => {
                const currentProps = formData.properties ? (() => {
                  try { return JSON.parse(formData.properties); } catch { return { keywords: formData.properties }; }
                })() : {};
                setFormData(prev => ({ 
                  ...prev, 
                  properties: JSON.stringify({ ...currentProps, keywords: e.target.value || undefined })
                }));
              }}
              placeholder="Enter keywords"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_type">Product Type</Label>
              <Select
                value={(() => {
                  if (!formData.properties) return '';
                  try {
                    const parsed = JSON.parse(formData.properties);
                    return parsed.product_type || '';
                  } catch {
                    return '';
                  }
                })()}
                onValueChange={(value) => {
                  const currentProps = formData.properties ? (() => {
                    try { return JSON.parse(formData.properties); } catch { return { keywords: formData.properties }; }
                  })() : {};
                  setFormData(prev => ({ 
                    ...prev, 
                    properties: JSON.stringify({ ...currentProps, product_type: value || undefined })
                  }));
                }}
              >
                <SelectTrigger id="product_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Cleanser">Cleanser</SelectItem>
                  <SelectItem value="Toner">Toner</SelectItem>
                  <SelectItem value="Serum">Serum</SelectItem>
                  <SelectItem value="Moisturizer">Moisturizer</SelectItem>
                  <SelectItem value="Supplement">Supplement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_of_day">Time of Day</Label>
              <Select
                value={(() => {
                  if (!formData.properties) return '';
                  try {
                    const parsed = JSON.parse(formData.properties);
                    return parsed.time_of_day || '';
                  } catch {
                    return '';
                  }
                })()}
                onValueChange={(value) => {
                  const currentProps = formData.properties ? (() => {
                    try { return JSON.parse(formData.properties); } catch { return { keywords: formData.properties }; }
                  })() : {};
                  setFormData(prev => ({ 
                    ...prev, 
                    properties: JSON.stringify({ ...currentProps, time_of_day: value || undefined })
                  }));
                }}
              >
                <SelectTrigger id="time_of_day">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Evening">Evening</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="routine_step">Routine Step</Label>
              <Input
                id="routine_step"
                type="text"
                value={(() => {
                  if (!formData.properties) return '';
                  try {
                    const parsed = JSON.parse(formData.properties);
                    return parsed.routine_step || '';
                  } catch {
                    return '';
                  }
                })()}
                onChange={(e) => {
                  const currentProps = formData.properties ? (() => {
                    try { return JSON.parse(formData.properties); } catch { return { keywords: formData.properties }; }
                  })() : {};
                  setFormData(prev => ({ 
                    ...prev, 
                    properties: JSON.stringify({ ...currentProps, routine_step: e.target.value || undefined })
                  }));
                }}
                placeholder="e.g., Step 1, Step 2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage_instructions">Usage Instructions</Label>
            <Textarea
              id="dosage_instructions"
              value={formData.dosage_instructions || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, dosage_instructions: e.target.value }))}
              placeholder="Enter usage instructions"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraindications" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Contraindications
            </Label>
            <Textarea
              id="contraindications"
              value={formData.contraindications || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, contraindications: e.target.value }))}
              placeholder="Enter contraindications and warnings"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_per_unit">Cost per Unit (฿)</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_per_unit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value ? parseFloat(e.target.value) : undefined }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retail_price">Retail Price (฿)</Label>
              <Input
                id="retail_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.retail_price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, retail_price: e.target.value ? parseFloat(e.target.value) : undefined }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.commission_rate !== null && formData.commission_rate !== undefined ? formData.commission_rate * 100 : 10}
                onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: e.target.value ? parseFloat(e.target.value) / 100 : 0.10 }))}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock_quantity">Stock Quantity</Label>
            <Input
              id="stock_quantity"
              type="number"
              min="0"
              value={formData.stock_quantity || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value ? parseInt(e.target.value) : 0 }))}
              placeholder="0"
            />
          </div>

          <ImageUploadManager
            images={productImages}
            onChange={setProductImages}
            onUpload={handleMultipleImageUpload}
            maxImages={10}
            uploadingImages={uploadingImages}
          />

          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications</Label>
            <div className="flex gap-2">
              <Input
                id="certifications"
                value={certificationInput}
                onChange={(e) => setCertificationInput(e.target.value)}
                placeholder="e.g., Organic, GMP, FDA Approved"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (certificationInput.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        certifications: [...(prev.certifications || []), certificationInput.trim()]
                      }));
                      setCertificationInput('');
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (certificationInput.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      certifications: [...(prev.certifications || []), certificationInput.trim()]
                    }));
                    setCertificationInput('');
                  }
                }}
              >
                Add
              </Button>
            </div>
            {formData.certifications && formData.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.certifications.map((cert, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        certifications: prev.certifications?.filter((_, i) => i !== index) || []
                      }));
                    }}
                  >
                    {cert} ×
                  </Badge>
                ))}
              </div>
          )}
        </div>

        {/* Course Gating Section */}
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="required_course_id">Required Course for Purchase (Optional)</Label>
            <Select
              value={(formData as any).required_course_id || ''}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                required_course_id: value || undefined 
              } as any))}
            >
              <SelectTrigger id="required_course_id">
                <SelectValue placeholder="Select course (no restriction if none)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Course Restriction</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Students must complete this course before they can purchase this product
            </p>
          </div>
        </div>

        {/* Subscription Pricing Section */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Subscription Pricing (Optional)</Label>
            <Switch
              checked={formData.subscription_enabled || false}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                subscription_enabled: checked,
                subscription_discount_percentage: checked ? (prev.subscription_discount_percentage || 5) : undefined
              }))}
            />
          </div>
          
          {formData.subscription_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="subscription_discount">Subscription Discount (%)</Label>
                <Input
                  id="subscription_discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.subscription_discount_percentage || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    subscription_discount_percentage: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  placeholder="5"
                />
                <p className="text-sm text-muted-foreground">
                  Customers will receive {formData.subscription_discount_percentage || 0}% off when they subscribe
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Available Subscription Intervals</Label>
                <div className="flex flex-wrap gap-2">
                  {(['weekly', 'monthly', 'quarterly'] as const).map(interval => (
                    <Badge
                      key={interval}
                      variant={(formData.subscription_intervals || []).includes(interval) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = (formData.subscription_intervals || []) as string[];
                        const updated = current.includes(interval)
                          ? current.filter(i => i !== interval)
                          : [...current, interval];
                        setFormData(prev => ({ ...prev, subscription_intervals: updated as any }));
                      }}
                    >
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
