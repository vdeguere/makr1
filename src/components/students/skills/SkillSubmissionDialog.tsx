import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploadManager } from '@/components/products/ImageUploadManager';
import { CameraCapture } from '@/components/assignments/CameraCapture';
import { queueUpload, syncQueuedUploads } from '@/lib/offlineQueue';
import { logger } from '@/lib/logger';

interface SkillSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  enrollmentId: string;
  lessonId?: string;
  assignmentId?: string;
  lessonName?: string;
  onSuccess?: () => void;
}

interface SubmissionData {
  notes: string;
  photos: string[];
  submissionType: 'photo' | 'video' | 'document';
}

export function SkillSubmissionDialog({
  open,
  onOpenChange,
  studentId,
  enrollmentId,
  lessonId,
  assignmentId,
  lessonName,
  onSuccess,
}: SkillSubmissionDialogProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SubmissionData>({
    notes: '',
    photos: [],
    submissionType: 'photo',
  });
  const [productImages, setProductImages] = useState<Array<{ url: string; isPrimary: boolean; order: number; caption?: string | null }>>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | undefined>();

  const totalSteps = 3; // photos + notes + review
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${studentId}/${crypto.randomUUID()}.${fileExt}`;
        const filePath = `student-work/${enrollmentId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('student-work')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('student-work')
          .getPublicUrl(filePath);

        return {
          url: data.publicUrl,
          isPrimary: productImages.length === 0,
          order: productImages.length,
          caption: null,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...productImages, ...uploadedImages];
      setProductImages(newImages);
      setFormData(prev => ({ ...prev, photos: newImages.map(img => img.url) }));

      // Haptic feedback on successful upload
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error: any) {
      logger.error('Error uploading images:', error);
      toast({
        title: 'Upload Error',
        description: error.message || 'Failed to upload photos',
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.photos.length === 0) {
      toast({
        title: 'Missing Photos',
        description: 'Please upload at least one photo of your work',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Check if online
      if (!navigator.onLine) {
        // Queue for offline sync
        await queueUpload({
          studentId,
          enrollmentId,
          lessonId,
          assignmentId,
          fileUrls: formData.photos,
          notes: formData.notes,
          submissionType: formData.submissionType,
        });

        toast({
          title: 'Submission queued',
          description: 'Your work will be submitted when you\'re back online.',
        });

        // Reset and close
        setFormData({
          notes: '',
          photos: [],
          submissionType: 'photo',
        });
        setProductImages([]);
        setCurrentStep(0);
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      const { error } = await supabase
        .from('skill_submissions')
        .insert({
          student_id: studentId,
          enrollment_id: enrollmentId,
          lesson_id: lessonId || null,
          assignment_id: assignmentId || null,
          submission_type: formData.submissionType,
          file_urls: formData.photos,
          notes: formData.notes,
          status: 'submitted',
        });

      if (error) throw error;

      // Try to sync any queued uploads
      await syncQueuedUploads(supabase);

      toast({
        title: 'Work submitted! 🎉',
        description: 'Your submission has been sent for review.',
      });

      // Haptic feedback on successful submission
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Reset and close
      setFormData({
        notes: '',
        photos: [],
        submissionType: 'photo',
      });
      setProductImages([]);
      setCurrentStep(0);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      logger.error('Error submitting work:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    // Convert data URL to blob and upload
    fetch(imageDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        const fileList = {
          0: file,
          length: 1,
          item: (index: number) => file,
          [Symbol.iterator]: function* () { yield file; },
        } as FileList;
        handleImageUpload(fileList);
        setShowCamera(false);
      });
  };

  const renderPhotoStep = () => {
    if (showCamera) {
      return (
        <div className="space-y-4 py-4">
          <CameraCapture
            onCapture={handleCameraCapture}
            onCancel={() => setShowCamera(false)}
            referenceImageUrl={referenceImageUrl}
            className="w-full"
          />
        </div>
      );
    }

    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2 text-center">
          <h3 className="text-xl md:text-2xl font-semibold">Upload Your Work</h3>
          <p className="text-sm text-muted-foreground">
            {lessonName ? `Submit photos of your work for: ${lessonName}` : 'Upload photos of your completed work'}
          </p>
        </div>

        {/* Camera or Gallery Options */}
        <div className="flex gap-2 max-w-md mx-auto mb-4">
          <Button
            type="button"
            onClick={() => setShowCamera(true)}
            variant="outline"
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Use Camera
          </Button>
          <Button
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.multiple = true;
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) handleImageUpload(files);
              };
              input.click();
            }}
            variant="outline"
            className="flex-1"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Choose from Gallery
          </Button>
        </div>

        <div className="max-w-md mx-auto">
          <ImageUploadManager
            images={productImages}
            onChange={setProductImages}
            onUpload={handleImageUpload}
            maxImages={5}
            uploadingImages={uploadingImages}
          />
        </div>

        {formData.photos.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-4">
            <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>At least one photo is required</p>
          </div>
        )}
      </div>
    );
  };

  const renderNotesStep = () => {
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2 text-center">
          <h3 className="text-xl md:text-2xl font-semibold">Add Notes (Optional)</h3>
          <p className="text-sm text-muted-foreground">
            Share any thoughts about your work or what you learned
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <Textarea
            placeholder="Describe your work, what you learned, or any challenges you faced..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={6}
            className="resize-none"
          />
        </div>
      </div>
    );
  };

  const renderReviewStep = () => {
    return (
      <div className="space-y-6 py-4">
        <div className="space-y-2 text-center">
          <h3 className="text-xl md:text-2xl font-semibold">Review Your Submission</h3>
          <p className="text-sm text-muted-foreground">
            Make sure everything looks good before submitting
          </p>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {formData.photos.length > 0 && (
            <div className="p-3 rounded-lg border bg-card">
              <div className="text-sm font-medium mb-2">Work Photos ({formData.photos.length})</div>
              <div className="grid grid-cols-2 gap-2">
                {formData.photos.map((photo, idx) => (
                  <img key={idx} src={photo} alt={`Work photo ${idx + 1}`} className="rounded-lg w-full h-24 object-cover" />
                ))}
              </div>
            </div>
          )}

          {formData.notes && (
            <div className="p-3 rounded-lg border bg-card">
              <div className="text-sm font-medium mb-1">Notes</div>
              <p className="text-sm text-muted-foreground italic">{formData.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return renderPhotoStep();
    } else if (currentStep === 1) {
      return renderNotesStep();
    } else {
      return renderReviewStep();
    }
  };

  const isReviewStep = currentStep === totalSteps - 1;
  const isPhotoStep = currentStep === 0;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Submit Your Work"
      description={`Step ${currentStep + 1} of ${totalSteps}`}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {currentStep + 1} of {totalSteps}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {isReviewStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || formData.photos.length === 0}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit Work
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={loading || uploadingImages || (isPhotoStep && formData.photos.length === 0)}
              className="min-w-[140px]"
            >
              {isPhotoStep ? 'Continue' : 'Review'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}

