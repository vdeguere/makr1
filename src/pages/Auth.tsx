import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserCircle, Stethoscope, ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import { 
  signInSchema, 
  signUpSchema, 
  passwordResetSchema,
  SignInFormData,
  SignUpFormData,
  PasswordResetFormData
} from '@/lib/validations/auth';
import {
  patientOnboardingSchema,
  practitionerOnboardingSchema,
  PatientOnboardingFormData,
  PractitionerOnboardingFormData
} from '@/lib/validations/onboarding';

type UserRole = 'patient' | 'practitioner';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation('auth');
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [signupStep, setSignupStep] = useState<'role' | 'credentials' | 'onboarding'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [credentialsData, setCredentialsData] = useState<SignUpFormData | null>(null);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  });

  const patientOnboardingForm = useForm<PatientOnboardingFormData>({
    resolver: zodResolver(patientOnboardingSchema)
  });

  const practitionerOnboardingForm = useForm<PractitionerOnboardingFormData>({
    resolver: zodResolver(practitionerOnboardingSchema)
  });

  const passwordResetForm = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema)
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (data: SignInFormData) => {
    setLoading(true);

    const { error } = await signIn(data.email, data.password);

    if (error) {
      trackEvent('login_failed', {
        method: 'email',
        error: error.message,
      });
      toast({
        title: t('signIn.error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      trackEvent('login', {
        method: 'email',
      });
      toast({
        title: t('signIn.success'),
        description: t('signIn.successDescription')
      });
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const handleCredentialsSubmit = async (data: SignUpFormData) => {
    setCredentialsData(data);
    setSignupStep('onboarding');
  };

  const handleOnboardingSubmit = async (data: PatientOnboardingFormData | PractitionerOnboardingFormData) => {
    if (!credentialsData) return;
    
    setLoading(true);

    // Create the user account with role
    const { data: signUpData, error: signUpError } = await signUp(
      credentialsData.email, 
      credentialsData.password, 
      credentialsData.fullName,
      selectedRole
    );

    if (signUpError) {
      toast({
        title: t('signUp.error'),
        description: signUpError.message,
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    // Complete onboarding with profile data
    try {
      const { error: onboardingError } = await supabase.functions.invoke('complete-onboarding', {
        body: {
          role: selectedRole,
          ...data
        }
      });

      if (onboardingError) {
        console.error('Onboarding error:', onboardingError);
        toast({
          title: 'Profile Update Error',
          description: 'Account created but profile update failed. You can update your profile later.',
          variant: 'destructive'
        });
      } else {
        trackEvent('sign_up', {
          method: 'email',
          role: selectedRole,
        });
        toast({
          title: t('signUp.success'),
          description: t('signUp.successDescription')
        });
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Profile Update Error',
        description: 'Account created but profile update failed. You can update your profile later.',
        variant: 'destructive'
      });
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const handlePasswordReset = async (data: PasswordResetFormData) => {
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth`
    });

    if (error) {
      toast({
        title: t('resetPassword.error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('resetPassword.success'),
        description: t('resetPassword.successDescription')
      });
      setShowPasswordReset(false);
    }

    setLoading(false);
  };

  const resetSignupFlow = () => {
    setSignupStep('role');
    setCredentialsData(null);
    signUpForm.reset();
    patientOnboardingForm.reset();
    practitionerOnboardingForm.reset();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      toast({
        title: 'Google Sign In Error',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleLineSignIn = async () => {
    try {
      setLoading(true);
      // LINE OAuth requires manual implementation
      const lineChannelId = '2006767764'; // You'll need to configure this
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const redirectUri = `${supabaseUrl}/functions/v1/line-oauth-callback`;
      const state = encodeURIComponent(JSON.stringify({
        origin: window.location.origin
      }));
      
      const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineChannelId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid%20email`;
      
      window.location.href = lineAuthUrl;
    } catch (error) {
      toast({
        title: 'LINE Sign In Error',
        description: 'Failed to initiate LINE sign in',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[hsl(152,30%,95%)] via-[hsl(152,25%,97%)] to-[hsl(152,30%,95%)] p-[clamp(1rem,4vw,2rem)] py-fluid-8">
        <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-fluid-2 pb-fluid-4">
          <CardTitle className="text-fluid-xl md:text-fluid-2xl font-bold">{t('title')}</CardTitle>
          <CardDescription className="text-fluid-sm md:text-fluid-base font-normal">
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-fluid-6">
          {showPasswordReset ? (
            <form onSubmit={passwordResetForm.handleSubmit(handlePasswordReset)} className="space-y-fluid-4">
              <div className="space-y-fluid-2">
                <Label htmlFor="reset-email" className="text-fluid-sm font-medium">{t('resetPassword.email')}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  inputMode="email"
                  placeholder={t('resetPassword.emailPlaceholder')}
                  className="text-fluid-base"
                  {...passwordResetForm.register('email')}
                />
                {passwordResetForm.formState.errors.email && (
                  <p className="text-fluid-sm text-destructive">
                    {passwordResetForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full text-fluid-base font-medium" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('resetPassword.button')}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-fluid-base"
                onClick={() => setShowPasswordReset(false)}
              >
                {t('resetPassword.backToSignIn')}
              </Button>
            </form>
          ) : (
            <Tabs defaultValue="signin" className="w-full" onValueChange={resetSignupFlow}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('tabs.signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('tabs.signUp')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-fluid-4 mt-fluid-4">
                  <div className="space-y-fluid-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-card hover:bg-muted/50 border-border text-foreground font-medium rounded-full transition-colors"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </Button>
                    <Button
                      type="button"
                      className="w-full bg-[#06C755] hover:bg-[#05b34b] text-white font-medium border-0 rounded-full"
                      onClick={handleLineSignIn}
                      disabled={loading}
                    >
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="white">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                      </svg>
                      Sign in with LINE
                    </Button>
                  </div>

                  <div className="relative my-fluid-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-fluid-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="space-y-fluid-2">
                    <Label htmlFor="signin-email" className="text-fluid-sm font-medium">{t('signIn.email')}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder={t('signIn.emailPlaceholder')}
                      className="text-fluid-base"
                      {...signInForm.register('email')}
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-fluid-sm text-destructive">
                        {signInForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-fluid-2">
                    <Label htmlFor="signin-password" className="text-fluid-sm font-medium">{t('signIn.password')}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      autoComplete="current-password"
                      className="text-fluid-base"
                      {...signInForm.register('password')}
                    />
                    {signInForm.formState.errors.password && (
                      <p className="text-fluid-sm text-destructive">
                        {signInForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full text-fluid-base font-medium bg-[hsl(152,45%,28%)] hover:bg-[hsl(152,45%,24%)] text-white" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('signIn.button')}
                  </Button>

                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full text-fluid-sm" 
                    onClick={() => setShowPasswordReset(true)}
                  >
                    {t('signIn.forgotPassword')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {signupStep === 'role' && (
                  <div className="space-y-fluid-6 mt-fluid-4">
                    <div className="space-y-fluid-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full bg-card hover:bg-muted/50 border-border text-foreground font-medium rounded-full transition-colors"
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                      >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign up with Google
                      </Button>
                        <Button
                          type="button"
                          className="w-full bg-[#06C755] hover:bg-[#05b34b] text-white font-medium border-0 rounded-full"
                          onClick={handleLineSignIn}
                          disabled={loading}
                      >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="white">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                        Sign up with LINE
                      </Button>
                    </div>

                    <div className="relative my-fluid-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-fluid-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
                      </div>
                    </div>

                    <div className="space-y-fluid-2">
                      <Label className="text-fluid-base">{t('roleSelection.title')}</Label>
                      <p className="text-fluid-sm text-muted-foreground">
                        {t('roleSelection.description')}
                      </p>
                    </div>
                    <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                      <div className="space-y-fluid-3">
                          <div className="flex items-start space-x-fluid-3 p-fluid-4 rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer">
                            <RadioGroupItem value="patient" id="patient" className="mt-1" />
                          <Label htmlFor="patient" className="cursor-pointer flex-1">
                            <div className="flex items-center gap-fluid-2 mb-fluid-1">
                              <UserCircle className="h-[clamp(18px,4vw,20px)] w-[clamp(18px,4vw,20px)]" />
                              <span className="font-semibold text-fluid-base">{t('roleSelection.patient.title')}</span>
                            </div>
                            <p className="text-fluid-sm text-muted-foreground">
                              {t('roleSelection.patient.description')}
                            </p>
                          </Label>
                        </div>
                          <div className="flex items-start space-x-fluid-3 p-fluid-4 rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer">
                            <RadioGroupItem value="practitioner" id="practitioner" className="mt-1" />
                          <Label htmlFor="practitioner" className="cursor-pointer flex-1">
                            <div className="flex items-center gap-fluid-2 mb-fluid-1">
                              <Stethoscope className="h-[clamp(18px,4vw,20px)] w-[clamp(18px,4vw,20px)]" />
                              <span className="font-semibold text-fluid-base">{t('roleSelection.practitioner.title')}</span>
                            </div>
                            <p className="text-fluid-sm text-muted-foreground">
                              {t('roleSelection.practitioner.description')}
                            </p>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                    <Button onClick={() => setSignupStep('credentials')} className="w-full text-fluid-base font-medium bg-[hsl(152,45%,28%)] hover:bg-[hsl(152,45%,24%)] text-white">
                      {t('roleSelection.continue')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {signupStep === 'credentials' && (
                  <form onSubmit={signUpForm.handleSubmit(handleCredentialsSubmit)} className="space-y-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSignupStep('role')}
                      className="mb-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> {t('navigation.back')}
                    </Button>
                    <div className="space-y-2">
                      <Label htmlFor="signup-fullname" className="font-medium">{t('signUp.fullName')}</Label>
                      <Input
                        id="signup-fullname"
                        type="text"
                        placeholder={t('signUp.fullNamePlaceholder')}
                        {...signUpForm.register('fullName')}
                      />
                      {signUpForm.formState.errors.fullName && (
                        <p className="text-sm text-destructive">
                          {signUpForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="font-medium">{t('signUp.email')}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t('signUp.emailPlaceholder')}
                        {...signUpForm.register('email')}
                      />
                      {signUpForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {signUpForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="font-medium">{t('signUp.password')}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        {...signUpForm.register('password')}
                      />
                      {signUpForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {signUpForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full font-medium bg-[hsl(152,45%,28%)] hover:bg-[hsl(152,45%,24%)] text-white">
                      {t('navigation.continue')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}

                {signupStep === 'onboarding' && selectedRole === 'patient' && (
                  <form onSubmit={patientOnboardingForm.handleSubmit(handleOnboardingSubmit)} className="space-y-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSignupStep('credentials')}
                      className="mb-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> {t('navigation.back')}
                    </Button>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-medium">{t('onboarding.patient.phone')}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t('onboarding.patient.phonePlaceholder')}
                        {...patientOnboardingForm.register('phone')}
                      />
                      {patientOnboardingForm.formState.errors.phone && (
                        <p className="text-sm text-destructive">
                          {patientOnboardingForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="font-medium">{t('onboarding.patient.dateOfBirth')}</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        {...patientOnboardingForm.register('date_of_birth')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medical_history" className="font-medium">{t('onboarding.patient.medicalHistory')}</Label>
                      <Textarea
                        id="medical_history"
                        placeholder={t('onboarding.patient.medicalHistoryPlaceholder')}
                        {...patientOnboardingForm.register('medical_history')}
                      />
                      {patientOnboardingForm.formState.errors.medical_history && (
                        <p className="text-sm text-destructive">
                          {patientOnboardingForm.formState.errors.medical_history.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allergies" className="font-medium">{t('onboarding.patient.allergies')}</Label>
                      <Textarea
                        id="allergies"
                        placeholder={t('onboarding.patient.allergiesPlaceholder')}
                        {...patientOnboardingForm.register('allergies')}
                      />
                      {patientOnboardingForm.formState.errors.allergies && (
                        <p className="text-sm text-destructive">
                          {patientOnboardingForm.formState.errors.allergies.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email_consent"
                        onCheckedChange={(checked) => 
                          patientOnboardingForm.setValue('email_consent', checked === true)
                        }
                      />
                      <Label htmlFor="email_consent" className="text-sm font-normal cursor-pointer">
                        {t('onboarding.patient.emailConsent')}
                      </Label>
                    </div>
                    <Button type="submit" className="w-full font-medium bg-[hsl(152,45%,28%)] hover:bg-[hsl(152,45%,24%)] text-white" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('signUp.button')}
                    </Button>
                  </form>
                )}

                {signupStep === 'onboarding' && selectedRole === 'practitioner' && (
                  <form onSubmit={practitionerOnboardingForm.handleSubmit(handleOnboardingSubmit)} className="space-y-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSignupStep('credentials')}
                      className="mb-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> {t('navigation.back')}
                    </Button>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-medium">{t('onboarding.practitioner.phone')}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t('onboarding.practitioner.phonePlaceholder')}
                        {...practitionerOnboardingForm.register('phone')}
                      />
                      {practitionerOnboardingForm.formState.errors.phone && (
                        <p className="text-sm text-destructive">
                          {practitionerOnboardingForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialization" className="font-medium">{t('onboarding.practitioner.specialization')}</Label>
                      <Input
                        id="specialization"
                        type="text"
                        placeholder={t('onboarding.practitioner.specializationPlaceholder')}
                        {...practitionerOnboardingForm.register('specialization')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license_number" className="font-medium">{t('onboarding.practitioner.licenseNumber')}</Label>
                      <Input
                        id="license_number"
                        type="text"
                        placeholder={t('onboarding.practitioner.licenseNumberPlaceholder')}
                        {...practitionerOnboardingForm.register('license_number')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practice_name" className="font-medium">{t('onboarding.practitioner.practiceName')}</Label>
                      <Input
                        id="practice_name"
                        type="text"
                        placeholder={t('onboarding.practitioner.practiceNamePlaceholder')}
                        {...practitionerOnboardingForm.register('practice_name')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="years_of_experience" className="font-medium">{t('onboarding.practitioner.yearsOfExperience')}</Label>
                      <Input
                        id="years_of_experience"
                        type="number"
                        min="0"
                        max="70"
                        placeholder="5"
                        {...practitionerOnboardingForm.register('years_of_experience', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="font-medium">{t('onboarding.practitioner.bio')}</Label>
                      <Textarea
                        id="bio"
                        placeholder={t('onboarding.practitioner.bioPlaceholder')}
                        {...practitionerOnboardingForm.register('bio')}
                      />
                      {practitionerOnboardingForm.formState.errors.bio && (
                        <p className="text-sm text-destructive">
                          {practitionerOnboardingForm.formState.errors.bio.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full font-medium bg-[hsl(152,45%,28%)] hover:bg-[hsl(152,45%,24%)] text-white" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('signUp.button')}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Right Side - Promotional Content (Desktop Only) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[hsl(152,45%,28%)] via-[hsl(152,45%,24%)] to-[hsl(152,50%,20%)] p-fluid-8 items-center justify-center">
        <div className="max-w-lg text-white space-y-fluid-6">
          <div className="space-y-fluid-4">
            <div className="inline-flex items-center gap-2 px-fluid-3 py-fluid-2 bg-white/10 rounded-full text-fluid-sm font-medium">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Featured Platform
            </div>
            <h2 className="text-fluid-3xl md:text-fluid-4xl font-bold leading-tight">
              Traditional Thai Medicine Platform
            </h2>
            <p className="text-fluid-lg text-white/90 leading-relaxed">
              Join the first comprehensive platform connecting practitioners with 100-year-old Traditional Thai Medicine formulas. Access education, safety protocols, and direct patient fulfillment across Europe.
            </p>
          </div>

          <div className="space-y-fluid-3 pt-fluid-4 border-t border-white/20">
            <div className="flex items-start gap-fluid-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-fluid-lg mb-1">Professional Education</h3>
                <p className="text-white/80 text-fluid-sm">Comprehensive courses on Traditional Thai Medicine practices and safety protocols.</p>
              </div>
            </div>

            <div className="flex items-start gap-fluid-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-fluid-lg mb-1">Patient Management</h3>
                <p className="text-white/80 text-fluid-sm">Streamlined tools for recommendations, tracking, and direct fulfillment to your patients.</p>
              </div>
            </div>

            <div className="flex items-start gap-fluid-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-fluid-lg mb-1">Authentic Formulas</h3>
                <p className="text-white/80 text-fluid-sm">Access to centuries-old Traditional Thai Medicine recipes with verified safety profiles.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
