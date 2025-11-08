import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, Calendar, FileText } from 'lucide-react';
import { PatientDetailDialog } from '@/components/patients/PatientDetailDialog';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  line_user_id: string | null;
  email_consent: boolean | null;
  practitioner_id: string;
  medical_history: string | null;
  allergies: string | null;
  profile_picture_url: string | null;
  profiles?: {
    full_name: string;
  };
}

export default function PatientManagement() {
  const { trackEvent } = useAnalytics();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: patients, isLoading, refetch } = useQuery({
    queryKey: ['admin-patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          profiles:practitioner_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Track GA4 event
      if (data) {
        trackEvent('manage_patients', {
          total_patients: data.length,
        });
      }
      
      return data as Patient[];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-patient-stats'],
    queryFn: async () => {
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      const { count: recentVisits } = await supabase
        .from('patient_visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { count: totalDocuments } = await supabase
        .from('patient_documents')
        .select('*', { count: 'exact', head: true });

      return {
        totalPatients: totalPatients || 0,
        recentVisits: recentVisits || 0,
        totalDocuments: totalDocuments || 0
      };
    }
  });

  const filteredPatients = patients?.filter(patient =>
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery)
  );

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedPatient(null);
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Patient Management</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all patient records across the system
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{stats?.totalPatients || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visits (30 days)</p>
                <p className="text-2xl font-bold">{stats?.recentVisits || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients?.map((patient) => (
              <Card key={patient.id} className="p-6 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handlePatientClick(patient)}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{patient.full_name}</h3>
                      {patient.date_of_birth && (
                        <Badge variant="secondary">
                          Age {Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {patient.email && <span>{patient.email}</span>}
                      {patient.phone && <span>{patient.phone}</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Practitioner: <span className="font-medium">{patient.profiles?.full_name || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Added {format(new Date(patient.created_at), 'MMM d, yyyy')}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {filteredPatients?.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No patients found</p>
              </div>
            )}
          </div>
        )}

        {selectedPatient && (
          <PatientDetailDialog
            patient={selectedPatient}
            open={isDialogOpen}
            onOpenChange={handleDialogClose}
            onUpdate={refetch}
            isAdminMode={true}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
