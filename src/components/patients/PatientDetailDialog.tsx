import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, Phone, Calendar, FileText, AlertCircle, 
  Edit, Trash2, Loader2, Activity, FileCheck, Folder, User, History, Link2,
  Pill, ShoppingCart, ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { PatientFormDialog } from './PatientFormDialog';
import { PatientConnectionDialog } from './PatientConnectionDialog';
import { VisitNotesTab } from './medical/VisitNotesTab';
import { VitalSignsTab } from './medical/VitalSignsTab';
import { DocumentsTab } from './medical/DocumentsTab';
import { RecommendationsTab } from './medical/RecommendationsTab';
import { OrdersTab } from './medical/OrdersTab';
import { logger } from '@/lib/logger';
import { TTMPatientProfileTab } from './ttm/TTMPatientProfileTab';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
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

interface PatientDetailDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  isAdminMode?: boolean;
}

export function PatientDetailDialog({ patient, open, onOpenChange, onUpdate, isAdminMode = false }: PatientDetailDialogProps) {
  const { trackEvent } = useAnalytics();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  
  // Track when patient details are viewed
  useEffect(() => {
    if (open && patient) {
      trackEvent('view_patient_details', {
        patient_id: patient.id,
      });
    }
  }, [open, patient, trackEvent]);

  const age = patient.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patient.id);

      if (error) throw error;

      toast.success('Student deleted successfully');
      onUpdate();
      onOpenChange(false);
      setIsDeleteOpen(false);
    } catch (error) {
      logger.error('Error deleting patient:', error);
      toast.error('Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-2xl">{patient.full_name}</DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditOpen(true)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <DialogDescription>
                  {age && `${age} years old • `}
                  Student since {format(new Date(patient.created_at), 'MMMM yyyy')}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {patient.allergies && patient.allergies.toLowerCase() !== 'none' && patient.allergies.trim() !== '' && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Has Allergies
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className={isAdminMode ? "grid w-full grid-cols-7" : "grid w-full grid-cols-6"}>
              <TabsTrigger value="overview">
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="visits">
                <FileCheck className="h-4 w-4 mr-2" />
                Visits
              </TabsTrigger>
              <TabsTrigger value="vitals">
                <Activity className="h-4 w-4 mr-2" />
                Vitals
              </TabsTrigger>
              <TabsTrigger value="documents">
                <Folder className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="recommendations">
                <Pill className="h-4 w-4 mr-2" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="ttm-profile">
                <ClipboardList className="h-4 w-4 mr-2" />
                Skin Profile
              </TabsTrigger>
              {isAdminMode && (
                <TabsTrigger value="audit">
                  <History className="h-4 w-4 mr-2" />
                  Audit Log
                </TabsTrigger>
              )}
            </TabsList>

            <ScrollArea className="h-[60vh] mt-4">
              <TabsContent value="overview" className="space-y-6 pr-4">
                <div>
                  <h3 className="font-semibold mb-3">Contact Information</h3>
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

                 <Separator />

                 {/* Connection Status */}
                 <div>
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                       <Link2 className="h-4 w-4 text-muted-foreground" />
                       <h3 className="font-semibold">Connection Status</h3>
                     </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsConnectionOpen(true);
                        }}
                      >
                        Manage Connection
                      </Button>
                   </div>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Portal Access Status */}
                <Badge variant={patient.user_id ? 'default' : 'secondary'}>
                  {patient.user_id ? '✓ Portal Access' : 'No Portal Access'}
                </Badge>
                
                {/* Email Status */}
                {patient.email && patient.email_consent ? (
                  <Badge variant="default">
                    ✓ Email Enabled
                  </Badge>
                ) : patient.email && !patient.email_consent ? (
                  <Badge variant="secondary">
                    Email (Not Consented)
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    No Email
                  </Badge>
                )}
                
                {/* LINE Status - with actionable button when not connected */}
                {patient.line_user_id ? (
                  <Badge variant="default">
                    ✓ LINE Connected
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsConnectionOpen(true);
                    }}
                  >
                    Connect LINE
                  </Button>
                )}
              </div>
                 </div>

                 <Separator />

                {patient.medical_history && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">Medical History</h3>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {patient.medical_history}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {patient.allergies && patient.allergies.toLowerCase() !== 'none' && patient.allergies.trim() !== '' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <h3 className="font-semibold text-destructive">Allergies</h3>
                    </div>
                    <p className="text-sm whitespace-pre-wrap bg-destructive/10 p-3 rounded-md">
                      {patient.allergies}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="visits" className="pr-4">
                <VisitNotesTab patientId={patient.id} isAdminMode={isAdminMode} />
              </TabsContent>

              <TabsContent value="vitals" className="pr-4">
                <VitalSignsTab patientId={patient.id} />
              </TabsContent>

            <TabsContent value="documents" className="pr-4">
              <DocumentsTab patientId={patient.id} />
            </TabsContent>

            <TabsContent value="recommendations" className="pr-4">
              <RecommendationsTab patientId={patient.id} />
            </TabsContent>

            <TabsContent value="orders" className="pr-4">
              <OrdersTab patientId={patient.id} />
            </TabsContent>

            <TabsContent value="ttm-profile" className="pr-4">
              <TTMPatientProfileTab patientId={patient.id} />
            </TabsContent>

            {isAdminMode && (
                <TabsContent value="audit" className="pr-4">
                  <AuditLogViewer patientId={patient.id} />
                </TabsContent>
              )}
            </ScrollArea>
          </Tabs>

          <Separator className="mt-4" />
          <div className="pt-4 flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PatientFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={() => {
          onUpdate();
          setIsEditOpen(false);
        }}
        patient={patient}
      />

      <PatientConnectionDialog
        open={isConnectionOpen}
        onOpenChange={(open) => {
          setIsConnectionOpen(open);
          if (!open) {
            onOpenChange(true);
            onUpdate();
          }
        }}
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
    </>
  );
}
