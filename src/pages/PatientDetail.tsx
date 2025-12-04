import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Mail, Phone, Calendar, ArrowLeft, 
  Edit, Trash2, Loader2, Activity, FileCheck, Folder, User, History, Link2,
  Pill, ShoppingCart, ClipboardList, AlertCircle, LineChart
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { PatientFormDialog } from '@/components/patients/PatientFormDialog';
import { PatientConnectionDialog } from '@/components/patients/PatientConnectionDialog';
import { VisitNotesTab } from '@/components/patients/medical/VisitNotesTab';
import { DocumentsTab } from '@/components/patients/medical/DocumentsTab';
import { OrdersTab } from '@/components/patients/medical/OrdersTab';
import { TTMPatientProfileTab } from '@/components/patients/ttm/TTMPatientProfileTab';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { getPatientInitials } from '@/lib/avatarUtils';
import { logger } from '@/lib/logger';
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

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  const isAdmin = role === 'admin';
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);

  const { data: patient, isLoading, refetch } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleDelete = async () => {
    if (!patient) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patient.id);

      if (error) throw error;

      toast.success('Student deleted successfully');
      navigate('/dashboard/patients');
    } catch (error) {
      logger.error('Error deleting patient:', error);
      toast.error('Failed to delete student');
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-4">The student you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const age = patient.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/patients')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Avatar className="h-16 w-16">
              <AvatarImage src={patient.profile_picture_url || undefined} />
              <AvatarFallback className="text-lg">
                {getPatientInitials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
                {patient.full_name}
                {age && <Badge variant="secondary">{age} years old</Badge>}
              </h1>
              <p className="text-sm text-muted-foreground">
                Student since {format(new Date(patient.created_at), 'MMMM yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(role === 'practitioner' || role === 'admin' || role === 'dev') && (
              <Button 
                variant="outline" 
                onClick={() => navigate(`/dashboard/practitioner/students/${patient.id}/progress`)}
              >
                <LineChart className="h-4 w-4 mr-2" />
                Score Progress
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Student
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ttm-profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="ttm-profile">
              <ClipboardList className="h-4 w-4 mr-2" />
              Skin Profile
            </TabsTrigger>
            <TabsTrigger value="visits">
              <FileCheck className="h-4 w-4 mr-2" />
              Visits
            </TabsTrigger>
            <TabsTrigger value="documents">
              <Folder className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contact Information</h3>
                <div className="space-y-3">
                  {patient.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{patient.email}</p>
                      </div>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{patient.phone}</p>
                      </div>
                    </div>
                  )}
                  {patient.date_of_birth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">
                          {format(new Date(patient.date_of_birth), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">Connection Status</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsConnectionOpen(true)}
                  >
                    Manage Connection
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={patient.user_id ? 'default' : 'secondary'}>
                    {patient.user_id ? '✓ Portal Access' : 'No Portal Access'}
                  </Badge>
                  {patient.email && patient.email_consent ? (
                    <Badge variant="default">✓ Email Enabled</Badge>
                  ) : patient.email && !patient.email_consent ? (
                    <Badge variant="secondary">Email (Not Consented)</Badge>
                  ) : null}
                  {patient.line_user_id && (
                    <Badge variant="default">✓ LINE Connected</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Medical Information</h3>
              {patient.medical_history && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Medical History</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                    {patient.medical_history}
                  </p>
                </div>
              )}
              {patient.allergies && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Allergies</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                    {patient.allergies}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-destructive">Danger Zone</h3>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Student
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="visits">
            <VisitNotesTab patientId={patient.id} isAdminMode={isAdmin} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="ttm-profile">
            <TTMPatientProfileTab patientId={patient.id} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="audit">
              <AuditLogViewer patientId={patient.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <PatientFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={() => {
          refetch();
          setIsEditOpen(false);
        }}
        patient={patient}
      />

      <PatientConnectionDialog
        open={isConnectionOpen}
        onOpenChange={setIsConnectionOpen}
        patient={patient}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {patient.full_name}? This action cannot be undone.
              All assignments and orders associated with this student will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
