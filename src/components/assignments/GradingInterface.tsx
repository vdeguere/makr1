import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, ArrowRight, Undo2, Trash2, Circle, ArrowRight as ArrowIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger } from '@/lib/logger';

interface GradingInterfaceProps {
  submissionId: string;
  studentName: string;
  lessonName?: string;
  fileUrls: string[];
  notes?: string;
  currentStatus: string;
  currentFeedback?: string;
  currentScore?: number;
  onGraded: () => void;
  onNext?: () => void;
}

interface Annotation {
  type: 'circle' | 'check' | 'arrow' | 'freehand';
  color: string;
  points: Array<{ x: number; y: number }>;
  id: string;
}

const CANNED_RESPONSES = [
  'Too deep',
  'Uneven saturation',
  'Perfect',
  'Needs more practice',
  'Excellent technique',
  'Adjust angle',
  'Great improvement',
  'Needs refinement',
];

export function GradingInterface({
  submissionId,
  studentName,
  lessonName,
  fileUrls,
  notes,
  currentStatus,
  currentFeedback,
  currentScore,
  onGraded,
  onNext,
}: GradingInterfaceProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'passed' | 'failed' | 'needs_revision'>(currentStatus === 'passed' ? 'passed' : currentStatus === 'failed' ? 'failed' : 'needs_revision');
  const [feedback, setFeedback] = useState(currentFeedback || '');
  const [score, setScore] = useState<number | undefined>(currentScore);
  const [selectedTool, setSelectedTool] = useState<'circle' | 'check' | 'arrow' | 'freehand'>('circle');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentImage = fileUrls[currentImageIndex];

  useEffect(() => {
    if (currentImage && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            redrawAnnotations();
          }
        }
        setImageLoaded(true);
      };
      img.src = currentImage;
      imageRef.current = img;
    }
  }, [currentImage]);

  const redrawAnnotations = () => {
    if (!canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);

    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 3;

      if (annotation.type === 'circle') {
        if (annotation.points.length >= 2) {
          const center = annotation.points[0];
          const radius = Math.sqrt(
            Math.pow(annotation.points[1].x - center.x, 2) +
            Math.pow(annotation.points[1].y - center.y, 2)
          );
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      } else if (annotation.type === 'check') {
        if (annotation.points.length >= 2) {
          const start = annotation.points[0];
          const end = annotation.points[1];
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.lineTo(end.x + 10, end.y - 10);
          ctx.stroke();
        }
      } else if (annotation.type === 'arrow') {
        if (annotation.points.length >= 2) {
          const start = annotation.points[0];
          const end = annotation.points[1];
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          // Arrowhead
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          ctx.lineTo(end.x - 10 * Math.cos(angle - Math.PI / 6), end.y - 10 * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(end.x - 10 * Math.cos(angle + Math.PI / 6), end.y - 10 * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
      } else if (annotation.type === 'freehand') {
        if (annotation.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
          annotation.points.slice(1).forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
      }
    });
  };

  useEffect(() => {
    redrawAnnotations();
  }, [annotations]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    const color = selectedTool === 'circle' ? '#ef4444' : selectedTool === 'check' ? '#22c55e' : '#3b82f6';
    const newAnnotation: Annotation = {
      type: selectedTool,
      color,
      points: [coords],
      id: crypto.randomUUID(),
    };
    setCurrentAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const updatedAnnotation = {
      ...currentAnnotation,
      points: [...currentAnnotation.points, coords],
    };
    setCurrentAnnotation(updatedAnnotation);

    // Redraw with current annotation
    if (canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageRef.current, 0, 0);
        redrawAnnotations();

        // Draw current annotation
        ctx.strokeStyle = updatedAnnotation.color;
        ctx.fillStyle = updatedAnnotation.color;
        ctx.lineWidth = 3;

        if (updatedAnnotation.type === 'circle' && updatedAnnotation.points.length >= 2) {
          const center = updatedAnnotation.points[0];
          const radius = Math.sqrt(
            Math.pow(updatedAnnotation.points[1].x - center.x, 2) +
            Math.pow(updatedAnnotation.points[1].y - center.y, 2)
          );
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (updatedAnnotation.type === 'freehand' && updatedAnnotation.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(updatedAnnotation.points[0].x, updatedAnnotation.points[0].y);
          updatedAnnotation.points.slice(1).forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (currentAnnotation) {
      setAnnotations(prev => [...prev, currentAnnotation]);
      setCurrentAnnotation(null);
    }
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setAnnotations(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAnnotations([]);
  };

  const handleCannedResponse = (response: string) => {
    setFeedback(prev => prev ? `${prev}\n${response}` : response);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('skill_submissions')
        .update({
          status,
          instructor_feedback: feedback,
          score: score || null,
          annotation_data: annotations,
          graded_by: (await supabase.auth.getUser()).data.user?.id,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: 'Grading saved!',
        description: `Submission marked as ${status}.`,
      });

      onGraded();
      onNext?.();
    } catch (error) {
      logger.error('Error grading submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to save grading.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left: Student Photo with Annotations */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Student Work</h3>
              {fileUrls.length > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentImageIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentImageIndex(prev => Math.min(fileUrls.length - 1, prev + 1))}
                    disabled={currentImageIndex === fileUrls.length - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            <div className="relative border rounded-lg overflow-hidden bg-black">
              <canvas
                ref={canvasRef}
                className="w-full h-auto max-h-[600px] cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>

            {/* Annotation Tools */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedTool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('circle')}
              >
                <Circle className="h-4 w-4 mr-2 text-red-500" />
                Error
              </Button>
              <Button
                variant={selectedTool === 'check' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('check')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Good
              </Button>
              <Button
                variant={selectedTool === 'arrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('arrow')}
              >
                <ArrowIcon className="h-4 w-4 mr-2 text-blue-500" />
                Adjust
              </Button>
              <Button
                variant={selectedTool === 'freehand' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('freehand')}
              >
                Draw
              </Button>
              <Button variant="outline" size="sm" onClick={handleUndo} disabled={annotations.length === 0}>
                <Undo2 className="h-4 w-4 mr-2" />
                Undo
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} disabled={annotations.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Reference Photo (if available) and Grading Controls */}
      <Card>
        <CardContent className="p-4 space-y-6">
          {/* Student Info */}
          <div>
            <h3 className="font-semibold mb-2">Student: {studentName}</h3>
            {lessonName && <p className="text-sm text-muted-foreground">Lesson: {lessonName}</p>}
            {notes && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <p className="font-medium">Student Notes:</p>
                <p className="text-muted-foreground">{notes}</p>
              </div>
            )}
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex gap-2">
              <Button
                variant={status === 'passed' ? 'default' : 'outline'}
                onClick={() => setStatus('passed')}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Pass
              </Button>
              <Button
                variant={status === 'failed' ? 'default' : 'outline'}
                onClick={() => setStatus('failed')}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Fail
              </Button>
              <Button
                variant={status === 'needs_revision' ? 'default' : 'outline'}
                onClick={() => setStatus('needs_revision')}
                className="flex-1"
              >
                Needs Revision
              </Button>
            </div>
          </div>

          {/* Score (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Score (Optional)</label>
            <Select
              value={score?.toString() || ''}
              onValueChange={(value) => setScore(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select score (1-5)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Needs Improvement</SelectItem>
                <SelectItem value="2">2 - Below Average</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Canned Responses */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Feedback</label>
            <div className="flex flex-wrap gap-2">
              {CANNED_RESPONSES.map((response) => (
                <Badge
                  key={response}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleCannedResponse(response)}
                >
                  {response}
                </Badge>
              ))}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Feedback</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add detailed feedback for the student..."
              rows={6}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save & {onNext ? 'Next' : 'Complete'}
                </>
              )}
            </Button>
            {onNext && (
              <Button variant="outline" onClick={onNext}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

