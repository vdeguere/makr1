import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradingInterface } from '@/components/assignments/GradingInterface';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Clock, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

interface Submission {
  id: string;
  student_id: string;
  lesson_id: string;
  enrollment_id: string;
  file_urls: string[];
  notes: string | null;
  status: string;
  instructor_feedback: string | null;
  score: number | null;
  created_at: string;
  students: {
    full_name: string;
  };
  course_lessons: {
    title: string;
    courses: {
      title: string;
    };
  };
}

export default function Submissions() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradingOpen, setIsGradingOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('skill_submissions')
        .select(`
          *,
          students:patients!skill_submissions_student_id_fkey(full_name),
          course_lessons:course_lessons!skill_submissions_lesson_id_fkey(
            title,
            courses:courses(title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      logger.error('Error fetching submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsGradingOpen(true);
  };

  const handleGraded = () => {
    setIsGradingOpen(false);
    setSelectedSubmission(null);
    fetchSubmissions();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'needs_revision':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Needs Revision</Badge>;
      case 'reviewing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Reviewing</Badge>;
      default:
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />Submitted</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Submissions</h1>
          <p className="text-muted-foreground">
            Review and grade student work submissions
          </p>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No submissions to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{submission.course_lessons?.title || 'Untitled Lesson'}</CardTitle>
                      <CardDescription className="mt-1">
                        {submission.students?.full_name || 'Unknown Student'} • {submission.course_lessons?.courses?.title || 'Unknown Course'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submission.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Student Notes:</p>
                        <p className="text-sm text-muted-foreground">{submission.notes}</p>
                      </div>
                    )}
                    {submission.file_urls && submission.file_urls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Files ({submission.file_urls.length}):</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {submission.file_urls.slice(0, 4).map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Submission ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-md border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {submission.instructor_feedback && (
                      <div>
                        <p className="text-sm font-medium mb-1">Feedback:</p>
                        <p className="text-sm text-muted-foreground">{submission.instructor_feedback}</p>
                      </div>
                    )}
                    {submission.score && (
                      <div>
                        <p className="text-sm font-medium">Score: {submission.score}/5</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Submitted {format(new Date(submission.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      <Button onClick={() => handleGrade(submission)} variant="outline" size="sm">
                        {submission.status === 'submitted' || submission.status === 'reviewing' ? 'Grade' : 'Review'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedSubmission && isGradingOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg shadow-lg w-full max-w-7xl max-h-[90vh] overflow-auto relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={() => {
                  setIsGradingOpen(false);
                  setSelectedSubmission(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="p-6">
                <GradingInterface
                  submissionId={selectedSubmission.id}
                  studentName={selectedSubmission.students?.full_name || 'Student'}
                  lessonName={selectedSubmission.course_lessons?.title}
                  fileUrls={selectedSubmission.file_urls || []}
                  notes={selectedSubmission.notes || undefined}
                  currentStatus={selectedSubmission.status}
                  currentFeedback={selectedSubmission.instructor_feedback || undefined}
                  currentScore={selectedSubmission.score || undefined}
                  onGraded={handleGraded}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

