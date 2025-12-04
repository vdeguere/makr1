import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CertificationCard } from '@/components/practitioner/certifications/CertificationCard';
import { CertificationFormDialog } from '@/components/practitioner/certifications/CertificationFormDialog';
import { logger } from '@/lib/logger';

export default function Certifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);

  const fetchCertifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('practitioner_certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      logger.error('Error fetching certifications:', error);
      toast({
        title: "Error",
        description: "Failed to load certifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, [user?.id]);

  const handleEdit = (cert: any) => {
    setEditingCert(cert);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('practitioner_certifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Certification deleted successfully"
      });
      fetchCertifications();
    } catch (error) {
      logger.error('Error deleting certification:', error);
      toast({
        title: "Error",
        description: "Failed to delete certification",
        variant: "destructive"
      });
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingCert(null);
    fetchCertifications();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Certifications</h1>
          <p className="text-muted-foreground">Manage your professional certifications and credentials</p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Add and manage your professional certifications, licenses, and credentials
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>

        {certifications.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No certifications added yet
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Certification
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {certifications.map((cert) => (
              <CertificationCard
                key={cert.id}
                certification={cert}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <CertificationFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingCert(null);
          }}
          certification={editingCert}
          onSuccess={handleSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
