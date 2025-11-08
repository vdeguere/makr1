import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, X, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
}

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  display_order: number;
}

interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  display_order: number;
}

interface QuizFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: any;
  onSuccess: () => void;
}

export function QuizFormDialog({
  open,
  onOpenChange,
  lesson,
  onSuccess,
}: QuizFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [editingQuiz, setEditingQuiz] = useState<string | null>(null);
  const [newQuizData, setNewQuizData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    max_attempts: null as number | null,
    time_limit_minutes: null as number | null,
  });

  useEffect(() => {
    if (open && lesson) {
      fetchQuizData();
    }
  }, [open, lesson]);

  const fetchQuizData = async () => {
    if (!lesson) return;

    try {
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('lesson_quizzes')
        .select('*')
        .eq('lesson_id', lesson.id);

      if (quizzesError) throw quizzesError;
      setQuizzes(quizzesData || []);

      if (quizzesData && quizzesData.length > 0) {
        const quizIds = quizzesData.map(q => q.id);
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .in('quiz_id', quizIds)
          .order('display_order');

        if (questionsError) throw questionsError;

        const questionsByQuiz = questionsData?.reduce((acc, q) => {
          if (!acc[q.quiz_id]) acc[q.quiz_id] = [];
          acc[q.quiz_id].push(q);
          return acc;
        }, {} as Record<string, Question[]>) || {};

        setQuestions(questionsByQuiz);

        if (questionsData && questionsData.length > 0) {
          const questionIds = questionsData.map(q => q.id);
          
          const { data: answersData, error: answersError } = await supabase
            .from('quiz_answers')
            .select('*')
            .in('question_id', questionIds)
            .order('display_order');

          if (answersError) throw answersError;

          const answersByQuestion = answersData?.reduce((acc, a) => {
            if (!acc[a.question_id]) acc[a.question_id] = [];
            acc[a.question_id].push(a);
            return acc;
          }, {} as Record<string, Answer[]>) || {};

          setAnswers(answersByQuestion);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateQuiz = async () => {
    if (!lesson || !newQuizData.title) {
      toast({
        title: 'Error',
        description: 'Please enter a quiz title',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_quizzes')
        .insert([{
          lesson_id: lesson.id,
          ...newQuizData,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Quiz created successfully',
      });

      setNewQuizData({
        title: '',
        description: '',
        passing_score: 70,
        max_attempts: null,
        time_limit_minutes: null,
      });

      fetchQuizData();
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Quiz deleted successfully',
      });

      fetchQuizData();
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Quiz Management: ${lesson?.title || ''}`}
      description="Create and manage quizzes for this lesson"
      className="max-w-4xl"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Quiz</CardTitle>
            <CardDescription>Add a quiz to test student understanding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input
                value={newQuizData.title}
                onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
                placeholder="Quiz title"
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={newQuizData.description}
                onChange={(e) => setNewQuizData({ ...newQuizData, description: e.target.value })}
                placeholder="Quiz description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Passing Score (%)</Label>
                <Input
                  type="number"
                  value={newQuizData.passing_score}
                  onChange={(e) => setNewQuizData({ ...newQuizData, passing_score: parseInt(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>

              <div className="grid gap-2">
                <Label>Max Attempts</Label>
                <Input
                  type="number"
                  value={newQuizData.max_attempts || ''}
                  onChange={(e) => setNewQuizData({ ...newQuizData, max_attempts: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Unlimited"
                />
              </div>

              <div className="grid gap-2">
                <Label>Time Limit (min)</Label>
                <Input
                  type="number"
                  value={newQuizData.time_limit_minutes || ''}
                  onChange={(e) => setNewQuizData({ ...newQuizData, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="No limit"
                />
              </div>
            </div>

            <Button onClick={handleCreateQuiz} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </CardContent>
        </Card>

        {quizzes.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Existing Quizzes</h3>
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      {quiz.description && (
                        <CardDescription>{quiz.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Badge>Passing: {quiz.passing_score}%</Badge>
                    {quiz.max_attempts && <Badge variant="outline">Max Attempts: {quiz.max_attempts}</Badge>}
                    {quiz.time_limit_minutes && <Badge variant="outline">Time: {quiz.time_limit_minutes}min</Badge>}
                    {questions[quiz.id] && (
                      <Badge variant="secondary">
                        {questions[quiz.id].length} question{questions[quiz.id].length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Note: Use the admin dashboard to add questions and answers to this quiz.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {quizzes.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No quizzes yet. Create one above to get started.
          </p>
        )}
      </div>
    </ResponsiveDialog>
  );
}
