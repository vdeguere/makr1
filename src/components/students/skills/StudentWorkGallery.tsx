import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, ZoomIn, CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { logger } from '@/lib/logger';

interface StudentSubmission {
  id: string;
  file_urls: string[];
  notes?: string;
  status: 'submitted' | 'reviewing' | 'passed' | 'failed' | 'needs_revision';
  instructor_feedback?: string;
  score?: number;
  created_at: string;
  lesson_id?: string;
  lesson_name?: string;
  course_name?: string;
}

interface StudentWorkGalleryProps {
  studentId: string;
  enrollmentId?: string;
}

export function StudentWorkGallery({ studentId, enrollmentId }: StudentWorkGalleryProps) {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    fetchSubmissions();
  }, [studentId, enrollmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('skill_submissions')
        .select(`
          id,
          file_urls,
          notes,
          status,
          instructor_feedback,
          score,
          created_at,
          lesson_id,
          lesson:course_lessons(id, title, course_id)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (enrollmentId) {
        query = query.eq('enrollment_id', enrollmentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch course names separately if needed
      const lessonIds = [...new Set((data || []).map((s: any) => s.lesson_id).filter(Boolean))];
      const courseMap: Record<string, string> = {};

      if (lessonIds.length > 0) {
        const { data: lessonsData } = await supabase
          .from('course_lessons')
          .select('id, course:courses(id, title)')
          .in('id', lessonIds);

        lessonsData?.forEach((lesson: any) => {
          if (lesson.course) {
            courseMap[lesson.id] = lesson.course.title;
          }
        });
      }

      const formattedSubmissions: StudentSubmission[] = (data || []).map((sub: any) => ({
        id: sub.id,
        file_urls: sub.file_urls || [],
        notes: sub.notes,
        status: sub.status,
        instructor_feedback: sub.instructor_feedback,
        score: sub.score,
        created_at: sub.created_at,
        lesson_id: sub.lesson_id,
        lesson_name: sub.lesson?.title,
        course_name: sub.lesson_id ? courseMap[sub.lesson_id] : undefined,
      }));

      setSubmissions(formattedSubmissions);
    } catch (error) {
      logger.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'needs_revision':
        return <Badge className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Needs Revision</Badge>;
      case 'reviewing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Reviewing</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    // Status filter
    if (filterStatus !== 'all' && submission.status !== filterStatus) return false;

    // Course filter
    if (filterCourse !== 'all' && submission.course_name !== filterCourse) return false;

    // Date range filter
    if (selectedDateRange.from || selectedDateRange.to) {
      const submissionDate = new Date(submission.created_at);
      if (selectedDateRange.from && submissionDate < selectedDateRange.from) return false;
      if (selectedDateRange.to && submissionDate > selectedDateRange.to) return false;
    }

    return true;
  });

  const uniqueCourses = Array.from(new Set(submissions.map(s => s.course_name).filter(Boolean)));

  if (loading) {
    return <div className="text-center p-8 text-muted-foreground">Loading student work...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="needs_revision">Needs Revision</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {uniqueCourses.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Course</label>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {uniqueCourses.map(course => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDateRange.from ? (
                  selectedDateRange.to ? (
                    <>
                      {format(selectedDateRange.from, 'LLL dd, y')} -{' '}
                      {format(selectedDateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(selectedDateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={selectedDateRange.from}
                selected={selectedDateRange}
                onSelect={(range: any) => setSelectedDateRange(range || {})}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No submissions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((submission) => (
            <Card
              key={submission.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedSubmission(submission)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Thumbnail */}
                {submission.file_urls.length > 0 && (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={submission.file_urls[0]}
                      alt="Student work"
                      className="w-full h-full object-cover"
                    />
                    {submission.file_urls.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        +{submission.file_urls.length - 1}
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(submission.status)}
                    {submission.score && (
                      <span className="text-sm font-medium">Score: {submission.score}/5</span>
                    )}
                  </div>

                  {submission.lesson_name && (
                    <p className="text-sm font-medium">{submission.lesson_name}</p>
                  )}
                  {submission.course_name && (
                    <p className="text-xs text-muted-foreground">{submission.course_name}</p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {format(new Date(submission.created_at), 'MMM dd, yyyy')}
                  </p>

                  {submission.instructor_feedback && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <p className="line-clamp-2">{submission.instructor_feedback}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedSubmission.lesson_name || 'Work Submission'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status and Score */}
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedSubmission.status)}
                  {selectedSubmission.score && (
                    <span className="text-lg font-semibold">Score: {selectedSubmission.score}/5</span>
                  )}
                  <span className="text-sm text-muted-foreground ml-auto">
                    {format(new Date(selectedSubmission.created_at), 'PPpp')}
                  </span>
                </div>

                {/* Photos */}
                {selectedSubmission.file_urls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Work Photos</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedSubmission.file_urls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                          <img
                            src={url}
                            alt={`Work photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Notes */}
                {selectedSubmission.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Student Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedSubmission.notes}
                    </p>
                  </div>
                )}

                {/* Instructor Feedback */}
                {selectedSubmission.instructor_feedback && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Instructor Feedback</h4>
                    <p className="text-sm bg-accent p-3 rounded-lg">
                      {selectedSubmission.instructor_feedback}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

