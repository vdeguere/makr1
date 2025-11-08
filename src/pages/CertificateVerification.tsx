import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CertificateVerification() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Verification Code Required",
        description: "Please enter a verification code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_certificates')
        .select(`
          *,
          user_id,
          course_id,
          courses (title, description),
          profiles (full_name)
        `)
        .eq('verification_code', verificationCode.trim())
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Certificate",
          description: "No certificate found with this verification code",
          variant: "destructive"
        });
        setCertificate(null);
      } else {
        setCertificate(data);
        toast({
          title: "Certificate Verified",
          description: "This certificate is authentic and valid"
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Failed",
        description: "An error occurred during verification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Certificate Verification</h1>
          <p className="text-muted-foreground text-lg">
            Verify the authenticity of course completion certificates
          </p>
        </div>

        <Card className="p-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Enter Verification Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
                <Button onClick={handleVerify} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {certificate && (
          <Card className="p-8 border-2 border-primary">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-6 border-b">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <h2 className="text-2xl font-bold text-green-600">
                    Certificate Verified ✓
                  </h2>
                  <p className="text-muted-foreground">
                    This certificate is authentic and valid
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Recipient
                  </h3>
                  <p className="text-lg font-semibold">
                    {certificate.profiles?.full_name || 'N/A'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Course
                  </h3>
                  <p className="text-lg font-semibold">
                    {certificate.courses?.title || 'N/A'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Issue Date
                  </h3>
                  <p className="text-lg">
                    {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Verification Code
                  </h3>
                  <p className="text-lg font-mono">
                    {certificate.verification_code}
                  </p>
                </div>
              </div>

              {certificate.certificate_url && (
                <div className="pt-6 border-t">
                  <Button
                    onClick={() => window.open(certificate.certificate_url, '_blank')}
                    className="w-full"
                  >
                    View Certificate
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
