import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, CheckCircle2, Lock, GraduationCap, ArrowLeft, PlayCircle, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { CourseProgressTracker } from '@/components/courses/CourseProgressTracker';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { logger } from '@/lib/logger';

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  difficulty_level: string;
  estimated_hours: number;
  category: string;
  prerequisites: any;
  learning_outcomes: any;
  is_enrolled: boolean;
  enrollment_id?: string;
  completion_percentage: number;
  price: number | null;
  included_products: string[] | null;
  included_kits: string[] | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  lesson_type: string;
  video_duration_seconds: number;
  display_order: number;
  is_completed: boolean;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch course details including pricing and included items
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*, included_products, included_kits, price')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Check enrollment
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id, completion_percentage')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('id, title, description, lesson_type, video_duration_seconds, display_order')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (lessonsError) throw lessonsError;

      // If enrolled, check lesson completion
      let completedLessons = new Set<string>();
      if (enrollment) {
        const { data: progress } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('enrollment_id', enrollment.id)
          .not('completed_at', 'is', null);

        completedLessons = new Set(progress?.map(p => p.lesson_id) || []);
      }

      setCourse({
        ...courseData,
        is_enrolled: !!enrollment,
        enrollment_id: enrollment?.id,
        completion_percentage: enrollment?.completion_percentage || 0,
      });

      setLessons(lessonsData?.map(lesson => ({
        ...lesson,
        is_completed: completedLessons.has(lesson.id),
      })) || []);
    } catch (error) {
      logger.error('Error fetching course details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if course has a price
      if (course?.price && course.price > 0) {
        // Paid course - create Stripe checkout session
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-course-checkout-session', {
          body: {
            course_id: courseId!,
            user_id: user.id,
          },
        });

        if (checkoutError) throw checkoutError;

        if (checkoutData?.error) {
          throw new Error(checkoutData.error);
        }

        // Redirect to Stripe Checkout
        if (checkoutData?.url) {
          window.location.href = checkoutData.url;
          return;
        }
      } else {
        // Free course - enroll directly and create kit orders
        await enrollAndCreateKitOrders(user.id);
      }
    } catch (error) {
      logger.error('Error enrolling:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to enroll in course',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const enrollAndCreateKitOrders = async (userId: string) => {
    // Get user profile to get name for patient record
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', userId)
      .single();

    // Get or create patient record for the student
    // In academy model, students are stored in patients table
    // Patients table has user_id field to link to auth.users
    let patientId: string | null = null;

    // Try to find existing patient record by user_id
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      // Get admin or first practitioner to link student to
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (adminProfile) {
        // Create patient record for student
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            practitioner_id: adminProfile.id,
            full_name: profile?.full_name || 'Student',
            user_id: userId,
          })
          .select('id')
          .single();

        if (patientError) {
          logger.error('Error creating patient record:', patientError);
          // Continue without patient record - orders will need patient_id
        } else {
          patientId = newPatient.id;
        }
      }
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId!,
        user_id: userId,
      })
      .select()
      .single();

    if (enrollmentError) throw enrollmentError;

    // Create orders for included products
    if (course?.included_products && Array.isArray(course.included_products) && course.included_products.length > 0 && patientId) {
      for (const productId of course.included_products) {
        // Get product details
        const { data: product, error: productError } = await supabase
          .from('herbs')
          .select('id, name, retail_price')
          .eq('id', productId)
          .single();

        if (productError) {
          logger.error(`Error fetching product ${productId}:`, productError);
          continue;
        }

        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            enrollment_id: enrollment.id,
            patient_id: patientId,
            total_amount: product.retail_price || 0,
            status: 'pending',
            order_type: 'course_kit',
          });

        if (orderError) {
          logger.error(`Error creating order for product ${productId}:`, orderError);
        }
      }
    }

    // Create orders for included kits
    if (course?.included_kits && Array.isArray(course.included_kits) && course.included_kits.length > 0 && patientId) {
      for (const kitId of course.included_kits) {
        // Get kit details
        const { data: kit, error: kitError } = await supabase
          .from('product_kits')
          .select('id, name, price')
          .eq('id', kitId)
          .single();

        if (kitError) {
          logger.error(`Error fetching kit ${kitId}:`, kitError);
          continue;
        }

        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            enrollment_id: enrollment.id,
            patient_id: patientId,
            total_amount: kit.price || 0,
            status: 'pending',
            order_type: 'course_kit',
          });

        if (orderError) {
          logger.error(`Error creating order for kit ${kitId}:`, orderError);
        }
      }
    }

    toast({
      title: 'Success',
      description: patientId && (course?.included_products?.length || course?.included_kits?.length) 
        ? 'Successfully enrolled in course! Your starter kit will be shipped soon.'
        : 'Successfully enrolled in course!',
    });

    fetchCourseDetails();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const getVideoEmbedUrl = (url: string): { type: 'youtube' | 'vimeo' | 'direct', embedUrl: string } => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1` };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` };
    }

    // Direct video URL
    return { type: 'direct', embedUrl: url };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-fluid-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-fluid-10">
            <p className="text-lg font-medium">Course not found</p>
            <Button onClick={() => navigate('/dashboard/courses')} className="mt-fluid-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner - Full Width */}
      <div className="relative h-[400px] w-full overflow-hidden">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:ml-[calc(14.4rem+2rem)] flex flex-col justify-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/courses')}
            className="text-white hover:text-white hover:bg-white/20 w-fit mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {course.title}
          </h1>
          <p className="text-white/90 text-lg">
            by Course Instructor | {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <DashboardLayout>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Resume */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Course Resume</h2>
              <p className="text-muted-foreground leading-relaxed">{course.description}</p>
            </section>

            {/* What's Included Section */}
            {(course?.included_products?.length || course?.included_kits?.length) && (
              <section>
                <h2 className="text-2xl font-bold mb-4">What's Included</h2>
                <Card>
                  <CardContent className="pt-6">
                    {course.included_products && course.included_products.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">Products Included:</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {course.included_products.map((productId: string) => (
                            <li key={productId}>Product ID: {productId}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {course.included_kits && course.included_kits.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Starter Kits Included:</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {course.included_kits.map((kitId: string) => (
                            <li key={kitId}>Kit ID: {kitId}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Course Details with Tabs */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Course Details</h2>
              <Tabs defaultValue="outcomes" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="outcomes" className="flex-1">What do you learn?</TabsTrigger>
                  <TabsTrigger value="prerequisites" className="flex-1">Prerequisites</TabsTrigger>
                </TabsList>
                <TabsContent value="outcomes" className="mt-6">
                  {course.learning_outcomes?.length > 0 ? (
                    <ul className="space-y-3">
                      {course.learning_outcomes.map((outcome, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No learning outcomes listed.</p>
                  )}
                </TabsContent>
                <TabsContent value="prerequisites" className="mt-6">
                  {course.prerequisites?.length > 0 ? (
                    <ul className="space-y-2">
                      {course.prerequisites.map((prereq, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-primary">•</span>
                          <span className="text-foreground">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No prerequisites required.</p>
                  )}
                </TabsContent>
              </Tabs>
            </section>

            {/* Status, Price, Get Started Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Status</h3>
                    {course.is_enrolled ? (
                      <Badge variant="default" className="bg-green-600">Enrolled</Badge>
                    ) : (
                      <Badge variant="secondary">Not Enrolled</Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Price</h3>
                    {course.price && course.price > 0 ? (
                      <p className="text-2xl font-bold text-green-600">${course.price.toFixed(2)}</p>
                    ) : (
                      <p className="text-2xl font-bold text-green-600">Free</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Get Started</h3>
                    {course.is_enrolled ? (
                      <Button 
                        onClick={() => navigate(`/dashboard/courses/${courseId}/learn`)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Continue Learning
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Content - Accordion */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Course Content</h2>
              <Card>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {lessons.map((lesson, idx) => (
                      <AccordionItem key={lesson.id} value={`lesson-${idx}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            {course.is_enrolled ? (
                              lesson.is_completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                              )
                            ) : (
                              <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="font-medium">{lesson.title}</span>
                            {lesson.video_duration_seconds > 0 && (
                              <span className="text-sm text-muted-foreground ml-auto">
                                {formatDuration(lesson.video_duration_seconds)}
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-8 pt-2">
                            <p className="text-muted-foreground">{lesson.description || 'No description available.'}</p>
                            {course.is_enrolled && (
                              <Button 
                                variant="link" 
                                className="mt-2 p-0 h-auto text-primary"
                                onClick={() => navigate(`/dashboard/courses/${courseId}/learn`, { 
                                  state: { lessonId: lesson.id } 
                                })}
                              >
                                Start Lesson →
                              </Button>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Course Info Card */}
            <Card className="sticky top-4">
              <CardContent className="p-0">
                {/* Video Preview */}
                <div className="relative">
                  <AspectRatio ratio={16 / 9}>
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <GraduationCap className="h-16 w-16 text-primary/30" />
                      </div>
                    )}
                  </AspectRatio>
                  {course.preview_video_url && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/10 transition-colors group"
                      onClick={() => setShowVideoDialog(true)}
                    >
                      <div className="bg-black/50 rounded-full p-4 group-hover:scale-110 transition-transform">
                        <PlayCircle className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Access Button */}
                  {course.is_enrolled ? (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                      onClick={() => navigate(`/dashboard/courses/${courseId}/learn`)}
                    >
                      Access Course
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      Enroll Now
                    </Button>
                  )}

                  {/* Metadata */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">Category</p>
                        <p className="text-muted-foreground">{course.category || 'General'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">Course Duration</p>
                        <p className="text-muted-foreground">{course.estimated_hours} hours • {lessons.length} lessons</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <GraduationCap className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">Level</p>
                        <p className="text-muted-foreground capitalize">{course.difficulty_level}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <Award className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">Certificate</p>
                        <p className="text-muted-foreground">Certificate after course complete</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracker - Only show if enrolled */}
            {course.is_enrolled && course.enrollment_id && (
              <CourseProgressTracker 
                courseId={courseId!} 
                enrollmentId={course.enrollment_id} 
              />
            )}
          </div>
        </div>

        {/* Video Preview Dialog */}
        <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
          <DialogContent className="max-w-4xl p-0">
            <div className="aspect-video bg-black">
              {course?.preview_video_url && (() => {
                const { type, embedUrl } = getVideoEmbedUrl(course.preview_video_url);
                
                if (type === 'direct') {
                  return (
                    <video
                      className="w-full h-full"
                      controls
                      autoPlay
                      src={embedUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  );
                }
                
                return (
                  <iframe
                    className="w-full h-full"
                    src={embedUrl}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </div>
  );
}