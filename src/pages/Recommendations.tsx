import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, FileText } from 'lucide-react';
import { RecommendationFormDialog } from '@/components/recommendations/RecommendationFormDialog';
import { RecommendationDetailDialog } from '@/components/recommendations/RecommendationDetailDialog';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface Recommendation {
  id: string;
  title: string;
  diagnosis: string | null;
  status: string;
  total_cost: number | null;
  created_at: string;
  sent_at: string | null;
  patients: { full_name: string };
  profiles?: { full_name: string };
}

export default function Recommendations() {
  const { user, loading: authLoading } = useAuth();
  const { activeRole } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return; // ProtectedRoute handles redirect
    fetchRecommendations();
  }, [authLoading, user, activeRole]);

  const fetchRecommendations = async () => {
    if (!user?.id) return;

    try {
      let query = supabase
        .from('recommendations')
        .select('*, patients!inner(full_name), profiles:practitioner_id(full_name)')
        .order('created_at', { ascending: false });

      // Only filter by practitioner_id if user is not admin
      if (activeRole !== 'admin') {
        query = query.eq('practitioner_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      logger.error('Error fetching recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesSearch = rec.patients.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || rec.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: recommendations.length,
    draft: recommendations.filter(r => r.status === 'draft').length,
    payment_pending: recommendations.filter(r => r.status === 'payment_pending').length,
    paid: recommendations.filter(r => r.status === 'paid').length,
    shipped: recommendations.filter(r => r.status === 'shipped').length,
    delivered: recommendations.filter(r => r.status === 'delivered').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Assignments</h1>
              <p className="text-muted-foreground">Create and manage student assignments</p>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Draft</CardDescription>
              <CardTitle className="text-3xl">{stats.draft}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl">{stats.payment_pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid</CardDescription>
              <CardTitle className="text-3xl">{stats.paid}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Shipped</CardDescription>
              <CardTitle className="text-3xl">{stats.shipped}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Delivered</CardDescription>
              <CardTitle className="text-3xl">{stats.delivered}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'draft' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('draft')}
            >
              Draft
            </Button>
            <Button
              variant={filterStatus === 'payment_pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('payment_pending')}
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === 'paid' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('paid')}
            >
              Paid
            </Button>
            <Button
              variant={filterStatus === 'shipped' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('shipped')}
            >
              Shipped
            </Button>
            <Button
              variant={filterStatus === 'delivered' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('delivered')}
            >
              Delivered
            </Button>
          </div>
        </div>

        {/* Assignments List */}
        {filteredRecommendations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all' 
                  ? 'No assignments found matching your filters'
                  : 'No assignments yet'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button onClick={() => setIsFormOpen(true)} className="mt-4">
                  Create Your First Assignment
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((rec) => (
              <Card key={rec.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedRecommendation(rec.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{rec.title}</CardTitle>
                        <Badge variant={
                          rec.status === 'draft' ? 'secondary' :
                          rec.status === 'payment_pending' ? 'outline' :
                          rec.status === 'paid' ? 'default' :
                          rec.status === 'shipped' ? 'default' :
                          rec.status === 'delivered' ? 'default' : 'outline'
                        }>
                          {rec.status === 'payment_pending' ? 'Payment Pending' : 
                           rec.status === 'paid' ? 'Paid' :
                           rec.status === 'shipped' ? 'Shipped' :
                           rec.status === 'delivered' ? 'Delivered' :
                           rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4">
                        <span>Student: {rec.patients.full_name}</span>
                        {activeRole === 'admin' && rec.profiles && (
                          <>
                            <span>•</span>
                            <span>Instructor: {rec.profiles.full_name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                        {rec.sent_at && (
                          <>
                            <span>•</span>
                            <span>Sent: {new Date(rec.sent_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    {rec.total_cost && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">฿{rec.total_cost.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                {rec.diagnosis && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{rec.diagnosis}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <RecommendationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          fetchRecommendations();
          setIsFormOpen(false);
        }}
      />

      {selectedRecommendation && (
        <RecommendationDetailDialog
          recommendationId={selectedRecommendation}
          open={!!selectedRecommendation}
          onOpenChange={(open) => !open && setSelectedRecommendation(null)}
          onUpdate={fetchRecommendations}
        />
      )}
    </DashboardLayout>
  );
}