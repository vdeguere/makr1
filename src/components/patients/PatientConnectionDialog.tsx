import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAnalytics } from '@/hooks/useAnalytics';
interface Patient {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  user_id?: string;
  line_user_id?: string;
  email_consent?: boolean;
}
interface PatientConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}
export function PatientConnectionDialog({
  open,
  onOpenChange,
  patient
}: PatientConnectionDialogProps) {
  const {
    toast
  } = useToast();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [accountLink, setAccountLink] = useState<{
    url: string;
    expires: string;
  } | null>(null);
  const [lineLink, setLineLink] = useState<{
    url: string;
    expires: string;
  } | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedLine, setCopiedLine] = useState(false);
  const generateLink = async (type: 'account_signup' | 'line_connect') => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-patient-connection-link', {
        body: {
          patient_id: patient.id,
          connection_type: type,
          app_origin: window.location.origin
        }
      });
      if (error) throw error;
      if (type === 'account_signup') {
        setAccountLink({
          url: data.connection_url,
          expires: data.expires_at
        });
        toast({
          title: 'Account signup link generated',
          description: 'Share this link with the patient to create their account.'
        });
        
        // Track GA4 event
        trackEvent('connect_patient', {
          patient_id: patient.id,
          connection_type: 'account_signup',
        });
      } else {
        setLineLink({
          url: data.connection_url,
          expires: data.expires_at
        });
        toast({
          title: 'LINE connection link generated',
          description: 'Share this link with the patient to connect their LINE account.'
        });
        
        // Track GA4 event
        trackEvent('connect_patient', {
          patient_id: patient.id,
          connection_type: 'line_connect',
        });
      }
    } catch (error) {
      console.error(`Error generating ${type} link:`, error);
      toast({
        title: 'Error',
        description: 'Failed to generate connection link. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const copyToClipboard = async (text: string, type: 'account' | 'line') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'account') {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
      } else {
        setCopiedLine(true);
        setTimeout(() => setCopiedLine(false), 2000);
      }
      toast({
        title: 'Copied!',
        description: 'Link copied to clipboard.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link.',
        variant: 'destructive'
      });
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Patient Connection</DialogTitle>
          <DialogDescription>
            Generate secure links for {patient.full_name} to connect their account and LINE.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-3">Current Connection Status</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant={patient.user_id ? 'default' : 'secondary'}>
                {patient.user_id ? '✓ Portal Access' : 'No Portal Access'}
              </Badge>
              <Badge variant={patient.email && patient.email_consent ? 'default' : 'secondary'}>
                {patient.email && patient.email_consent ? '✓ Email Enabled' : patient.email ? 'Email (Not Consented)' : 'No Email'}
              </Badge>
              <Badge variant={patient.line_user_id ? 'default' : 'secondary'}>
                {patient.line_user_id ? '✓ LINE Connected' : 'No LINE'}
              </Badge>
            </div>
          </div>

          {/* Email Consent Management */}
          {patient.email && !patient.email_consent && <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Enable Email Notifications</h3>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Email address on file: <span className="font-medium text-foreground">{patient.email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Patient has not consented to receive email communications. Update their record to enable email notifications.
                </p>
              </div>
            </div>}

          {patient.email && patient.email_consent && <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Email Notifications Enabled</h3>
              </div>
              <div className="rounded-lg border bg-primary/5 border-primary/20 p-3">
                <p className="text-sm text-muted-foreground">
                  ✓ Patient has consented to email at: <span className="font-medium text-foreground">{patient.email}</span>
                </p>
              </div>
            </div>}

          {!patient.email && <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">No Email on File</h3>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  Add an email address to the patient's profile to enable email notifications.
                </p>
              </div>
            </div>}

          {/* Account Signup Link */}
          {!patient.user_id && <div className="space-y-3">
              

              {accountLink && <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <code className="flex-1 text-xs break-all">{accountLink.url}</code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(accountLink.url, 'account')}>
                      {copiedAccount ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expires: {format(new Date(accountLink.expires), 'PPp')}
                  </p>
                </div>}
            </div>}

          {/* LINE Connection Link */}
          {!patient.line_user_id && <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">LINE Connection Link</h3>
                </div>
                <Button onClick={() => generateLink('line_connect')} disabled={loading} size="sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Link'}
                </Button>
              </div>

              {lineLink && <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <code className="flex-1 text-xs break-all">{lineLink.url}</code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(lineLink.url, 'line')}>
                      {copiedLine ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expires: {format(new Date(lineLink.expires), 'PPp')}
                  </p>
                </div>}
            </div>}

          {/* All Connected Message */}
          {patient.user_id && patient.line_user_id && <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                ✓ Patient is fully connected with both portal access and LINE messaging.
              </p>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
}