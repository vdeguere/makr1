import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function PatientConnect() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-patient-connection-token', {
        body: { token },
      });

      if (error || !data.valid) {
        setValid(false);
        setError(data?.error || 'Invalid or expired connection link.');
      } else {
        setValid(true);
        setPatientName(data.patient.full_name);
        setPatientEmail(data.patient.email || '');
        setEmail(data.patient.email || '');
      }
    } catch (err) {
      logger.error('Error verifying token:', err);
      setValid(false);
      setError('Failed to verify connection link.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create account as patient
      const { data: signUpData, error: signUpError } = await signUp(email, password, patientName, 'patient');

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('No user returned from signup');
      }

      // Connect account to patient record
      const { data: connectData, error: connectError } = await supabase.functions.invoke(
        'connect-patient-account',
        {
          body: {
            token,
            user_id: signUpData.user.id,
          },
        }
      );

      if (connectError || !connectData.success) {
        throw connectError || new Error('Failed to connect account');
      }

      toast({
        title: 'Success!',
        description: 'Your account has been created and connected.',
      });

      // Redirect to patient dashboard
      setTimeout(() => {
        navigate('/dashboard/student/records');
      }, 1000);
    } catch (err: any) {
      logger.error('Error creating account:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying connection link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invalid Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Please contact your healthcare practitioner for a new connection link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <CardTitle>Create Your Account</CardTitle>
          </div>
          <CardDescription>
            Connect your account for <strong>{patientName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account & Connect'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you'll be able to view your health records,
              recommendations, and order history.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
