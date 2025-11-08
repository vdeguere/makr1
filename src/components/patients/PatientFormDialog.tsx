import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BirthDatePicker } from '@/components/ui/birth-date-picker';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { logAudit } from '@/lib/auditLog';
import { toast } from 'sonner';
import { Loader2, Upload, X, Crop } from 'lucide-react';
import { format } from 'date-fns';
import { patientSchema } from '@/lib/validations/patient';
import { z } from 'zod';
import { useAnalytics } from '@/hooks/useAnalytics';
import { uploadPatientAvatar, deletePatientAvatar, getPatientInitials } from '@/lib/avatarUtils';

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  patient?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    medical_history: string | null;
    allergies: string | null;
    user_id: string | null;
    email_consent: boolean | null;
    profile_picture_url: string | null;
  } | null;
}

export function PatientFormDialog({ open, onOpenChange, onSuccess, patient }: PatientFormDialogProps) {
  const { user } = useAuth();
  const { role } = useRole();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(patient?.profile_picture_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: patient?.full_name || '',
    email: patient?.email || '',
    phone: patient?.phone || '',
    date_of_birth: patient?.date_of_birth ? new Date(patient.date_of_birth) : undefined,
    medical_history: patient?.medical_history || '',
    allergies: patient?.allergies || '',
    email_consent: patient?.email_consent || false,
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WEBP image');
      return;
    }

    // Validate file size (5MB for original, will be resized)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Load image for cropping
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageForCrop(reader.result as string);
      setIsCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setAvatarFile(croppedBlob);
    
    // Create preview URL from blob
    const previewUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(previewUrl);
    
    toast.success('Image cropped successfully');
  };

  const handleRemoveAvatar = async () => {
    if (patient?.profile_picture_url) {
      setUploadingAvatar(true);
      try {
        await deletePatientAvatar(patient.profile_picture_url);
        const { error } = await supabase
          .from('patients')
          .update({ profile_picture_url: null })
          .eq('id', patient.id);
        
        if (error) throw error;
        toast.success('Profile picture removed');
      } catch (error) {
        console.error('Error removing avatar:', error);
        toast.error('Failed to remove profile picture');
      } finally {
        setUploadingAvatar(false);
      }
    }
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Validate form data
      const validationData = {
        full_name: formData.full_name,
        email: formData.email || '',
        phone: formData.phone || '',
        date_of_birth: formData.date_of_birth ? format(formData.date_of_birth, 'yyyy-MM-dd') : null,
        medical_history: formData.medical_history || '',
        allergies: formData.allergies || '',
        email_consent: formData.email_consent,
      };

      const validated = patientSchema.parse(validationData);

      // Upload avatar if new file selected
      let profilePictureUrl = patient?.profile_picture_url || null;
      if (avatarFile) {
        setUploadingAvatar(true);
        try {
          // Delete old avatar if updating
          if (patient?.profile_picture_url) {
            await deletePatientAvatar(patient.profile_picture_url);
          }
          
          // Upload new avatar (use patient.id or generate temp ID for new patients)
          const patientIdForUpload = patient?.id || crypto.randomUUID();
          
          // Convert blob to file for upload
          const file = new File([avatarFile], `avatar-${patientIdForUpload}.jpg`, { type: 'image/jpeg' });
          profilePictureUrl = await uploadPatientAvatar(file, patientIdForUpload);
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload profile picture');
          setUploadingAvatar(false);
          setLoading(false);
          return;
        } finally {
          setUploadingAvatar(false);
        }
      }

      const patientData = {
        full_name: validated.full_name,
        email: validated.email || null,
        phone: validated.phone || null,
        date_of_birth: validationData.date_of_birth,
        medical_history: validated.medical_history || null,
        allergies: validated.allergies || null,
        email_consent: validated.email ? validated.email_consent : false,
        practitioner_id: user.id,
        profile_picture_url: profilePictureUrl,
      };

      if (patient) {
        // Update existing patient
        const { error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', patient.id);

        if (error) throw error;
        
        // Log audit if admin
        if (role === 'admin') {
          await logAudit({
            action: 'patient_updated',
            patientId: patient.id,
            recordType: 'patient',
            recordId: patient.id,
            details: { updated_fields: Object.keys(patientData) }
          });
        }
        
        toast.success('Patient updated successfully');
      } else {
        // Create new patient
        const { data: newPatient, error } = await supabase
          .from('patients')
          .insert([patientData])
          .select()
          .single();

        if (error) throw error;
        
        // Log audit if admin
        if (role === 'admin' && newPatient) {
          await logAudit({
            action: 'patient_created',
            patientId: newPatient.id,
            recordType: 'patient',
            recordId: newPatient.id
          });
        }
        
        // Track GA4 event
        trackEvent('create_patient', {
          patient_id: newPatient.id,
          has_email: !!patientData.email,
          has_email_consent: patientData.email_consent,
        });
        
        toast.success('Patient added successfully');
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: undefined,
        medical_history: '',
        allergies: '',
        email_consent: false,
      });
    } catch (error) {
      console.error('Error saving patient:', error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Failed to save patient');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
          <DialogDescription>
            {patient ? 'Update patient information' : 'Enter the patient details below'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture Upload */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-lg">
                {formData.full_name ? getPatientInitials(formData.full_name) : '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar" className="text-sm font-medium">Profile Picture</Label>
              <p className="text-xs text-muted-foreground mb-2">Optional. JPEG, PNG, or WEBP. Max 2MB.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar')?.click()}
                  disabled={uploadingAvatar}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {avatarPreview ? 'Change' : 'Upload'}
                </Button>
                {avatarPreview && avatarFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedImageForCrop(avatarPreview);
                      setIsCropDialogOpen(true);
                    }}
                    disabled={uploadingAvatar}
                  >
                    <Crop className="h-4 w-4 mr-2" />
                    Re-crop
                  </Button>
                )}
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formData.email && (
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="email_consent"
                    checked={formData.email_consent}
                    onChange={(e) => setFormData({ ...formData, email_consent: e.target.checked })}
                    className="rounded border-input"
                  />
                  <label htmlFor="email_consent" className="text-sm text-muted-foreground cursor-pointer">
                    Patient consents to receive email communications
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <BirthDatePicker
              value={formData.date_of_birth}
              onChange={(date) => setFormData({ ...formData, date_of_birth: date })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_history">Medical History</Label>
            <Textarea
              id="medical_history"
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              placeholder="Enter relevant medical history..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="List any known allergies..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingAvatar}>
              {(loading || uploadingAvatar) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {patient ? 'Update Patient' : 'Add Patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Image Crop Dialog */}
      {selectedImageForCrop && (
        <ImageCropDialog
          open={isCropDialogOpen}
          onOpenChange={setIsCropDialogOpen}
          imageSrc={selectedImageForCrop}
          onCropComplete={handleCropComplete}
          aspectRatio={1} // Square crop for profile pictures
        />
      )}
    </Dialog>
  );
}
