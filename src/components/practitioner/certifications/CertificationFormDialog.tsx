import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import { logger } from '@/lib/logger';

const certificationSchema = z.object({
  certification_name: z.string().min(1, 'Certification name is required'),
  issuing_organization: z.string().min(1, 'Issuing organization is required'),
  certification_number: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  expiry_date: z.string().optional(),
  credential_type: z.string().min(1, 'Credential type is required'),
  verification_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional()
});

type CertificationFormData = z.infer<typeof certificationSchema>;

interface CertificationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification?: any;
  onSuccess: () => void;
}

export function CertificationFormDialog({
  open,
  onOpenChange,
  certification,
  onSuccess
}: CertificationFormDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      credential_type: 'certification'
    }
  });

  useEffect(() => {
    if (certification) {
      reset({
        certification_name: certification.certification_name,
        issuing_organization: certification.issuing_organization,
        certification_number: certification.certification_number || '',
        issue_date: certification.issue_date,
        expiry_date: certification.expiry_date || '',
        credential_type: certification.credential_type,
        verification_url: certification.verification_url || '',
        notes: certification.notes || ''
      });
    } else {
      reset({
        credential_type: 'certification'
      });
    }
  }, [certification, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file || !user?.id) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('practitioner-credentials')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      return fileName;
    } catch (error) {
      logger.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: CertificationFormData) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let filePath = certification?.file_path;
      
      if (file) {
        const uploadedPath = await uploadFile();
        if (uploadedPath) filePath = uploadedPath;
      }

      const certData: any = {
        ...data,
        user_id: user.id,
        file_path: filePath,
        status: 'active',
        issuing_organization: data.issuing_organization,
        certification_name: data.certification_name,
        issue_date: data.issue_date,
        credential_type: data.credential_type
      };

      if (certification) {
        const { error } = await supabase
          .from('practitioner_certifications')
          .update(certData)
          .eq('id', certification.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('practitioner_certifications')
          .insert([certData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Certification ${certification ? 'updated' : 'added'} successfully`
      });
      onSuccess();
    } catch (error) {
      logger.error('Error saving certification:', error);
      toast({
        title: "Error",
        description: "Failed to save certification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {certification ? 'Edit Certification' : 'Add Certification'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="certification_name">Certification Name *</Label>
            <Input
              id="certification_name"
              {...register('certification_name')}
              placeholder="e.g., Traditional Thai Medicine Practitioner"
            />
            {errors.certification_name && (
              <p className="text-sm text-red-600 mt-1">{errors.certification_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="issuing_organization">Issuing Organization *</Label>
            <Input
              id="issuing_organization"
              {...register('issuing_organization')}
              placeholder="e.g., Thai Traditional Medical Council"
            />
            {errors.issuing_organization && (
              <p className="text-sm text-red-600 mt-1">{errors.issuing_organization.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="credential_type">Credential Type *</Label>
              <Select
                onValueChange={(value) => setValue('credential_type', value)}
                defaultValue="certification"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="degree">Degree</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="certification_number">Certificate Number</Label>
              <Input
                id="certification_number"
                {...register('certification_number')}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issue_date">Issue Date *</Label>
              <Input
                id="issue_date"
                type="date"
                {...register('issue_date')}
              />
              {errors.issue_date && (
                <p className="text-sm text-red-600 mt-1">{errors.issue_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                {...register('expiry_date')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="verification_url">Verification URL</Label>
            <Input
              id="verification_url"
              type="url"
              {...register('verification_url')}
              placeholder="https://..."
            />
            {errors.verification_url && (
              <p className="text-sm text-red-600 mt-1">{errors.verification_url.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="file">Upload Certificate Document</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <p className="text-sm text-muted-foreground mt-1">
              PDF, JPG, or PNG (max 10MB)
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional information..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {uploading ? 'Uploading...' : loading ? 'Saving...' : certification ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
