import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2 } from 'lucide-react';
import { PatientCard } from './PatientCard';
import { PatientFormDialog } from './PatientFormDialog';
import { toast } from 'sonner';

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  medical_history: string | null;
  allergies: string | null;
  practitioner_id: string;
  user_id: string | null;
  line_user_id: string | null;
  email_consent: boolean | null;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

export function PatientsList() {
  const { user } = useAuth();
  const { role, activeRole } = useRole();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [user, role]);

  const fetchPatients = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false });

      // Practitioners see only their patients, admins and devs see all
      if (activeRole === 'practitioner' && role !== 'dev') {
        query = query.eq('practitioner_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.full_name.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchQuery)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-fluid-4">
      <div className="flex flex-col sm:flex-row gap-fluid-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 min-h-touch text-fluid-base"
            inputMode="search"
          />
        </div>
        {role !== 'patient' && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="min-h-touch w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        )}
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center py-fluid-8 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-fluid-base text-muted-foreground">
            {searchQuery ? 'No patients found matching your search' : 'No patients yet'}
          </p>
          {role !== 'patient' && !searchQuery && (
            <Button
              variant="outline"
              className="mt-fluid-4 min-h-touch"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Patient
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-fluid-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}

      <PatientFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchPatients}
      />
    </div>
  );
}
