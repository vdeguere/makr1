import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Package, AlertCircle, Leaf, Filter, Settings, SlidersHorizontal, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HerbDetailDialog } from '@/components/herbs/HerbDetailDialog';
import { HerbFormDialog } from '@/components/herbs/HerbFormDialog';
import { CategoryManagementDialog } from '@/components/herbs/CategoryManagementDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StarRating } from '@/components/products/StarRating';
import { Info } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getHerbPrice } from '@/lib/currency';
import { calculateSubscriptionPrice } from '@/lib/subscriptionUtils';
import { logger } from '@/lib/logger';

interface Category {
  id: string;
  name: string;
  description: string | null;
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
  stock_quantity: number | null;
  cost_per_unit: number | null;
  retail_price: number | null;
  commission_rate: number | null;
  image_url: string | null;
  images?: ProductImage[] | null;
  category_id: string | null;
  brand: string | null;
  certifications: string[] | null;
  product_categories?: Category | null;
  average_rating?: number | null;
  review_count?: number | null;
  subscription_enabled?: boolean | null;
  subscription_discount_percentage?: number | null;
  subscription_intervals?: string[] | null;
  required_course_id?: string | null;
  required_certification_id?: string | null;
}

export default function Herbs() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { activeRole } = useRole();
  const { toast } = useToast();
  const { currency, formatPrice } = useCurrency();
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [filteredHerbs, setFilteredHerbs] = useState<Herb[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingHerb, setEditingHerb] = useState<Herb | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [certifications, setCertifications] = useState<Set<string>>(new Set());

  // ProtectedRoute handles auth redirect - no need for page-level check

  useEffect(() => {
    if (user) {
      fetchHerbs();
      fetchCategories();
      if (activeRole === 'patient') {
        fetchStudentProgress();
      }
    }
  }, [user, activeRole]);

  const fetchStudentProgress = async () => {
    if (!user) return;

    try {
      // Get student ID
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!patient) return;

      // Fetch completed courses
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('completion_percentage', 100);

      if (enrollments) {
        setCompletedCourses(new Set(enrollments.map(e => e.course_id)));
      }

      // Fetch certifications
      const { data: certs } = await supabase
        .from('course_certificates')
        .select('certification_id')
        .eq('student_id', patient.id);

      if (certs) {
        setCertifications(new Set(certs.map(c => c.certification_id).filter(Boolean)));
      }
    } catch (error) {
      logger.error('Error fetching student progress:', error);
    }
  };

  useEffect(() => {
    let filtered = [...herbs];

    // Course-gated filter for students
    if (activeRole === 'patient') {
      filtered = filtered.filter((herb) => {
        // Show all products if admin/instructor, or if student has completed required course/certification
        if (herb.required_course_id && !completedCourses.has(herb.required_course_id)) {
          return false; // Hide if course requirement not met
        }
        if (herb.required_certification_id && !certifications.has(herb.required_certification_id)) {
          return false; // Hide if certification requirement not met
        }
        return true;
      });
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (herb) =>
          herb.name.toLowerCase().includes(query) ||
          herb.thai_name?.toLowerCase().includes(query) ||
          herb.scientific_name?.toLowerCase().includes(query) ||
          herb.properties?.toLowerCase().includes(query) ||
          herb.brand?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((herb) => herb.category_id === selectedCategory);
    }

    // Stock filters
    if (showInStockOnly) {
      filtered = filtered.filter((herb) => herb.stock_quantity && herb.stock_quantity > 0);
    }
    if (showLowStockOnly) {
      filtered = filtered.filter((herb) => herb.stock_quantity && herb.stock_quantity > 0 && herb.stock_quantity <= 50);
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        const priceA = a.retail_price || 0;
        const priceB = b.retail_price || 0;
        compareValue = priceA - priceB;
      } else if (sortBy === 'stock') {
        compareValue = (a.stock_quantity || 0) - (b.stock_quantity || 0);
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredHerbs(filtered);
  }, [searchQuery, herbs, selectedCategory, sortBy, sortOrder, showInStockOnly, showLowStockOnly, activeRole, completedCourses, certifications]);

  const fetchHerbs = async () => {
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
        .order('name');

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedData = (data || []).map(herb => ({
        ...herb,
        certifications: Array.isArray(herb.certifications) ? herb.certifications as string[] : null,
        images: Array.isArray(herb.images) ? herb.images as unknown as ProductImage[] : null
      })) as Herb[];
      
      setHerbs(typedData);
    } catch (error) {
      logger.error('Error fetching herbs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load herbs catalog',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPrimaryImage = (herb: Herb) => {
    if (herb.images && herb.images.length > 0) {
      const primary = herb.images.find(img => img.isPrimary);
      return primary?.url || herb.images[0]?.url || null;
    }
    return herb.image_url;
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const getDisplayPrice = (herb: Herb) => {
    // Always return retail_price as the main display price
    return herb.retail_price;
  };

  const getPageTitle = () => {
    if (activeRole === 'admin') return 'Product Management';
    if (activeRole === 'practitioner') return 'Product Catalog';
    return 'Herbs Catalog';
  };

  const getPageDescription = () => {
    if (activeRole === 'admin') return 'Manage herbal products and pricing';
    if (activeRole === 'practitioner') return 'Browse products with practitioner pricing';
    return 'Browse traditional Thai medicine herbs';
  };

  const handleCreateNew = () => {
    setEditingHerb(null);
    setFormDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedHerb) {
      setEditingHerb(selectedHerb);
      setFormDialogOpen(true);
      setDetailDialogOpen(false);
    }
  };

  const handleFormSuccess = () => {
    fetchHerbs();
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
              <p className="text-muted-foreground">{getPageDescription()}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-fluid-4 md:space-y-6">
        <div className="flex items-center gap-fluid-3">
          <Leaf className="h-[clamp(24px,6vw,32px)] w-[clamp(24px,6vw,32px)]" />
          <div>
            <h1 className="text-fluid-xl md:text-fluid-3xl font-bold">{getPageTitle()}</h1>
            <p className="text-fluid-sm md:text-fluid-base text-muted-foreground">{getPageDescription()}</p>
          </div>
        </div>

          <div className="flex flex-col gap-fluid-4">
          <div className="flex items-center gap-fluid-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search herbs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-touch text-fluid-base"
                inputMode="search"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] min-h-touch">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="min-h-touch min-w-touch shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Filters & Sorting</h4>
                  
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={(value: 'name' | 'price' | 'stock') => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="stock">Stock Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="in-stock">In Stock Only</Label>
                    <Switch
                      id="in-stock"
                      checked={showInStockOnly}
                      onCheckedChange={setShowInStockOnly}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="low-stock">Low Stock Only</Label>
                    <Switch
                      id="low-stock"
                      checked={showLowStockOnly}
                      onCheckedChange={setShowLowStockOnly}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Badge variant="outline" className="whitespace-nowrap">
              <Package className="h-3 w-3 mr-1" />
              {filteredHerbs.length} products
            </Badge>

            {activeRole === 'admin' && (
              <>
                <Button variant="outline" onClick={() => setCategoryDialogOpen(true)} className="min-h-touch">
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Categories</span>
                  <span className="sm:hidden">Cat.</span>
                </Button>
                <Button onClick={handleCreateNew} className="min-h-touch">
                  <Package className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Create Product</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {filteredHerbs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No herbs found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'No herbs available in the catalog'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-fluid-4 md:gap-fluid-6">
            {filteredHerbs.map((herb) => (
              <Card 
                key={herb.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => navigate(`/dashboard/herbs/${herb.id}`)}
              >
                <div className="aspect-square relative bg-muted">
                  {getPrimaryImage(herb) ? (
                    <img
                      src={getPrimaryImage(herb)!}
                      alt={herb.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {herb.stock_quantity !== null && herb.stock_quantity <= 50 && (
                    <Badge
                      variant={herb.stock_quantity === 0 ? 'destructive' : 'secondary'}
                      className="absolute top-2 right-2"
                    >
                      {herb.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </Badge>
                  )}
                  {(herb.required_course_id || herb.required_certification_id) && activeRole === 'patient' && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 bg-yellow-600 text-white"
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      Restricted
                    </Badge>
                  )}
                  {herb.stock_quantity !== null && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 right-2"
                    >
                      Stock: {herb.stock_quantity}
                    </Badge>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{herb.name}</CardTitle>
                      {herb.thai_name && (
                        <p className="text-sm text-muted-foreground mt-1">{herb.thai_name}</p>
                      )}
                      {herb.brand && (
                        <p className="text-xs text-muted-foreground mt-1">Brand: {herb.brand}</p>
                      )}
                      
                      {/* Rating */}
                      {herb.average_rating && herb.average_rating > 0 && (
                        <div className="mt-2">
                          <StarRating 
                            rating={herb.average_rating} 
                            size="sm" 
                            showCount 
                            reviewCount={herb.review_count || 0}
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {herb.product_categories && (
                          <Badge variant="secondary">
                            {herb.product_categories.name}
                          </Badge>
                        )}
                        {activeRole === 'patient' && (
                          <Badge variant="outline" className="gap-1">
                            <Info className="w-3 h-3" />
                            Practitioner Only
                          </Badge>
                        )}
                      </div>
                    </div>
                    {getDisplayPrice(herb) && (
                      <div className="text-right">
                        <Badge variant="outline" className="font-semibold">
                          {formatPrice(getDisplayPrice(herb))}
                        </Badge>
                        {(activeRole === 'admin' || activeRole === 'dev') && herb.cost_per_unit && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Cost: {formatPrice(herb.cost_per_unit)}
                          </p>
                        )}
                        {herb.subscription_enabled && herb.subscription_discount_percentage && (
                          <div className="mt-2 space-y-1">
                            <Badge variant="secondary" className="text-xs">
                              Subscribe & Save {herb.subscription_discount_percentage}%
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(
                                calculateSubscriptionPrice(
                                  herb.retail_price || 0, 
                                  herb.subscription_discount_percentage
                                )
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {herb.scientific_name && (
                    <CardDescription className="italic text-xs">
                      {herb.scientific_name}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {herb.description && (
                    <p className="text-sm line-clamp-2">{herb.description}</p>
                  )}

                  {herb.properties && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Properties:</p>
                      <p className="text-xs line-clamp-2">{herb.properties}</p>
                    </div>
                  )}

                  {herb.contraindications && (
                    <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
                      <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive line-clamp-2">
                        {herb.contraindications}
                      </p>
                    </div>
                  )}
                </CardContent>

              </Card>
            ))}
          </div>
        )}
      </div>

      <HerbDetailDialog
        herb={selectedHerb}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        displayPrice={selectedHerb ? getDisplayPrice(selectedHerb) : null}
        userRole={activeRole}
        onEdit={activeRole === 'admin' ? handleEdit : undefined}
      />

      <HerbFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSuccess={handleFormSuccess}
        herb={editingHerb}
      />

      <CategoryManagementDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
      />
    </DashboardLayout>
  );
}
