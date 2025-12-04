import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from "@/lib/logger";

interface Question {
  id: string;
  question_text: string;
  explanation: string;
  display_order: number;
  answers: Answer[];
}

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  display_order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
}

interface LessonQuizProps {
  lessonId: string;
  enrollmentId: string;
  onComplete: () => void;
}

export default function LessonQuiz({ lessonId, enrollmentId, onComplete }: LessonQuizProps) {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  useEffect(() => {
    if (timeRemaining === null || submitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitted]);

  const fetchQuiz = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Fetch quiz
      const { data: quizData, error: quizError } = await supabase
        .from("lesson_quizzes")
        .select("*")
        .eq("lesson_id", lessonId)
        .single();

      if (quizError) {
        if (quizError.code === "PGRST116") {
          setLoading(false);
          return;
        }
        throw quizError;
      }

      setQuiz(quizData);

      if (quizData.time_limit_minutes) {
        setTimeRemaining(quizData.time_limit_minutes * 60);
      }

      // Fetch questions and answers
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select(`
          *,
          quiz_answers (*)
        `)
        .eq("quiz_id", quizData.id)
        .order("display_order");

      if (questionsError) throw questionsError;

      const formattedQuestions = questionsData.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        explanation: q.explanation,
        display_order: q.display_order,
        answers: q.quiz_answers.sort((a: any, b: any) => a.display_order - b.display_order),
      }));

      setQuestions(formattedQuestions);

      // Check previous attempts
      const { data: attemptsData } = await supabase
        .from("quiz_attempts")
        .select("attempt_number")
        .eq("quiz_id", quizData.id)
        .eq("user_id", user.user.id)
        .order("attempt_number", { ascending: false })
        .limit(1);

      if (attemptsData && attemptsData.length > 0) {
        setAttemptNumber(attemptsData[0].attempt_number + 1);
      }

      setLoading(false);
    } catch (error) {
      logger.error("Error fetching quiz:", error);
      toast.error("Failed to load quiz");
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questions[currentQuestionIndex].id]: answerId,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Calculate score
    let correctAnswers = 0;
    const answersData: any = {};

    questions.forEach((question) => {
      const selectedAnswerId = selectedAnswers[question.id];
      const correctAnswer = question.answers.find((a) => a.is_correct);
      const isCorrect = selectedAnswerId === correctAnswer?.id;

      if (isCorrect) correctAnswers++;

      answersData[question.id] = {
        question: question.question_text,
        selected: question.answers.find((a) => a.id === selectedAnswerId)?.answer_text,
        correct: correctAnswer?.answer_text,
        is_correct: isCorrect,
        explanation: question.explanation,
      };
    });

    const scorePercentage = Math.round((correctAnswers / questions.length) * 100);
    const quizPassed = scorePercentage >= (quiz?.passing_score || 70);

    setScore(scorePercentage);
    setPassed(quizPassed);
    setSubmitted(true);
    setShowResults(true);

    // Save attempt
    try {
      await supabase.from("quiz_attempts").insert({
        quiz_id: quiz?.id,
        user_id: user.user.id,
        enrollment_id: enrollmentId,
        attempt_number: attemptNumber,
        completed_at: new Date().toISOString(),
        score_percentage: scorePercentage,
        passed: quizPassed,
        answers_data: answersData,
        time_taken_seconds: quiz?.time_limit_minutes
          ? quiz.time_limit_minutes * 60 - (timeRemaining || 0)
          : null,
      });

      if (quizPassed) {
        toast.success(`Congratulations! You passed with ${scorePercentage}%`);
        onComplete();
      } else {
        toast.error(`You scored ${scorePercentage}%. Passing score is ${quiz?.passing_score}%`);
      }
    } catch (error) {
      logger.error("Error saving quiz attempt:", error);
      toast.error("Failed to save quiz results");
    }
  };

  const handleRetake = () => {
    if (quiz?.max_attempts && attemptNumber >= quiz.max_attempts) {
      toast.error(`Maximum attempts (${quiz.max_attempts}) reached`);
      return;
    }

    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setSubmitted(false);
    setShowResults(false);
    setAttemptNumber(attemptNumber + 1);
    if (quiz?.time_limit_minutes) {
      setTimeRemaining(quiz.time_limit_minutes * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz || questions.length === 0) {
    return null;
  }

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <CheckCircle2 className="h-6 w-6 text-success" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )}
            Quiz Results
          </CardTitle>
          <CardDescription>
            {passed
              ? "You've successfully passed this quiz!"
              : "You didn't pass this time. Review the material and try again."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">{score}%</div>
            <p className="text-muted-foreground">
              Passing score: {quiz.passing_score}%
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((question, idx) => {
              const selectedAnswerId = selectedAnswers[question.id];
              const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId);
              const correctAnswer = question.answers.find((a) => a.is_correct);
              const isCorrect = selectedAnswerId === correctAnswer?.id;

              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        Question {idx + 1}: {question.question_text}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Your answer: <span className={isCorrect ? "text-success" : "text-destructive"}>
                          {selectedAnswer?.answer_text || "Not answered"}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-muted-foreground mb-1">
                          Correct answer: <span className="text-success">{correctAnswer?.answer_text}</span>
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground italic mt-2">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back to Course
          </Button>
          {!passed && (!quiz.max_attempts || attemptNumber < quiz.max_attempts) && (
            <Button onClick={handleRetake}>
              Retake Quiz
              {quiz.max_attempts && ` (${attemptNumber}/${quiz.max_attempts})`}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allAnswered = Object.keys(selectedAnswers).length === questions.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>{quiz.title}</CardTitle>
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className={timeRemaining < 60 ? "text-destructive font-bold" : ""}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
        <CardDescription>{quiz.description}</CardDescription>
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {quiz.max_attempts && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Attempt {attemptNumber} of {quiz.max_attempts} | Passing score: {quiz.passing_score}%
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h3>

          <RadioGroup
            value={selectedAnswers[currentQuestion.id] || ""}
            onValueChange={handleAnswerSelect}
          >
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => (
                <div
                  key={answer.id}
                  className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer"
                >
                  <RadioGroupItem value={answer.id} id={answer.id} />
                  <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                    {answer.answer_text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {!isLastQuestion ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
