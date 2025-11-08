import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WellnessCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  recommendationId?: string;
  onSuccess?: () => void;
}

interface WellnessData {
  overall_feeling: number;
  symptom_improvement: number;
  treatment_satisfaction: number;
  energy_levels: number;
  sleep_quality: number;
  notes: string;
}

const questions = [
  {
    id: 'overall_feeling' as keyof WellnessData,
    title: 'How are you feeling overall?',
    description: 'Rate your general well-being today',
  },
  {
    id: 'symptom_improvement' as keyof WellnessData,
    title: 'How are your symptoms?',
    description: 'Compare to when you started treatment',
  },
  {
    id: 'treatment_satisfaction' as keyof WellnessData,
    title: 'How satisfied are you with your treatment?',
    description: 'Rate your satisfaction with the current plan',
  },
  {
    id: 'energy_levels' as keyof WellnessData,
    title: 'How are your energy levels?',
    description: 'Rate your daily energy and vitality',
  },
  {
    id: 'sleep_quality' as keyof WellnessData,
    title: 'How is your sleep quality?',
    description: 'Rate how well you\'ve been sleeping',
  },
];

const ratingOptions = [
  { value: 1, emoji: '😢', label: 'Much Worse', color: 'text-destructive' },
  { value: 2, emoji: '😕', label: 'Worse', color: 'text-orange-500' },
  { value: 3, emoji: '😐', label: 'Same', color: 'text-muted-foreground' },
  { value: 4, emoji: '🙂', label: 'Better', color: 'text-primary' },
  { value: 5, emoji: '😄', label: 'Much Better', color: 'text-green-500' },
];

export function WellnessCheckDialog({
  open,
  onOpenChange,
  patientId,
  recommendationId,
  onSuccess,
}: WellnessCheckDialogProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WellnessData>({
    overall_feeling: 3,
    symptom_improvement: 3,
    treatment_satisfaction: 3,
    energy_levels: 3,
    sleep_quality: 3,
    notes: '',
  });

  const totalSteps = questions.length + 2; // questions + notes + review
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleRatingSelect = (value: number) => {
    const currentQuestion = questions[currentStep];
    setFormData(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('patient_wellness_surveys')
        .insert({
          patient_id: patientId,
          recommendation_id: recommendationId || null,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: 'Wellness check completed! 🎉',
        description: 'Thank you for sharing your progress.',
      });

      // Reset and close
      setFormData({
        overall_feeling: 3,
        symptom_improvement: 3,
        treatment_satisfaction: 3,
        energy_levels: 3,
        sleep_quality: 3,
        notes: '',
      });
      setCurrentStep(0);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting wellness check:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = () => {
    if (currentStep >= questions.length) return null;

    const question = questions[currentStep];
    const currentValue = formData[question.id] as number;

    return (
      <div className="space-y-6 py-4">
        <div className="space-y-2 text-center">
          <h3 className="text-xl md:text-2xl font-semibold">{question.title}</h3>
          <p className="text-sm text-muted-foreground">{question.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                handleRatingSelect(option.value);
                // Auto-advance after a short delay for better UX
                setTimeout(() => handleNext(), 300);
              }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border-2 transition-all',
                'hover:border-primary hover:bg-accent',
                'touch-manipulation min-h-[60px]',
                currentValue === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              )}
            >
              <span className="text-3xl">{option.emoji}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">Rating: {option.value}/5</div>
              </div>
              {currentValue === option.value && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderNotesStep = () => {
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2 text-center">
          <h3 className="text-xl md:text-2xl font-semibold">Any additional thoughts?</h3>
          <p className="text-sm text-muted-foreground">
            Share anything else about your health (optional)
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <Textarea
            placeholder="Your notes here..."
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
    const getOptionForValue = (value: number) => {
      return ratingOptions.find(opt => opt.value === value);
    };

    return (
      <div className="space-y-6 py-4">
        <div className="space-y-2 text-center">
          <h3 className="text-xl md:text-2xl font-semibold">Review your wellness check</h3>
          <p className="text-sm text-muted-foreground">
            Make sure everything looks good before submitting
          </p>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {questions.map((question) => {
            const value = formData[question.id] as number;
            const option = getOptionForValue(value);
            return (
              <div
                key={question.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{question.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{option?.emoji}</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">{option?.label}</div>
                    <div className="text-xs text-muted-foreground">{value}/5</div>
                  </div>
                </div>
              </div>
            );
          })}

          {formData.notes && (
            <div className="p-3 rounded-lg border bg-card">
              <div className="text-sm font-medium mb-1">Additional Notes</div>
              <p className="text-sm text-muted-foreground italic">{formData.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    if (currentStep < questions.length) {
      return renderQuestion();
    } else if (currentStep === questions.length) {
      return renderNotesStep();
    } else {
      return renderReviewStep();
    }
  };

  const isReviewStep = currentStep === totalSteps - 1;
  const isNotesStep = currentStep === questions.length;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Wellness Check-In"
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
              disabled={loading}
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
                  Submit
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="min-w-[140px]"
            >
              {isNotesStep ? 'Review' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
