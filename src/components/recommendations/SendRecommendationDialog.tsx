import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAnalytics } from '@/hooks/useAnalytics';

interface SendRecommendationDialogProps {
  recommendationId: string;
  recommendationStatus?: string;
  sentAt?: string | null;
  existingChannels?: string[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SendRecommendationDialog({ 
  recommendationId, 
  recommendationStatus,
  sentAt,
  existingChannels,
  open, 
  onOpenChange, 
  onSuccess 
}: SendRecommendationDialogProps) {
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [lineAvailable, setLineAvailable] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendLine, setSendLine] = useState(false);
  const [optionalMessage, setOptionalMessage] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (open) {
      checkAvailableChannels();
    }
  }, [open, recommendationId]);

  const checkAvailableChannels = async () => {
    const { data, error } = await supabase
      .from('recommendations')
      .select('patients!inner(email, email_consent, line_user_id)')
      .eq('id', recommendationId)
      .single();

    if (error) {
      console.error('Error checking channels:', error);
      toast({
        title: 'Channel Check Failed',
        description: 'Could not determine available notification channels',
        variant: 'destructive',
      });
      return;
    }

    if (data) {
      // Email is available only if both email exists AND consent is given
      const hasEmail = !!data.patients.email && !!data.patients.email_consent;
      const hasLine = !!data.patients.line_user_id;
      
      setEmailAvailable(hasEmail);
      setLineAvailable(hasLine);
      setSendEmail(hasEmail);
      setSendLine(hasLine);
    }
  };

  const handleSend = async () => {
    if (!sendEmail && !sendLine) {
      toast({
        title: 'No Channel Selected',
        description: 'Please select at least one notification channel',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const channels = [];
      if (sendEmail) channels.push('email');
      if (sendLine) channels.push('line');

      const isResend = recommendationStatus === 'sent';
      
      const { data, error } = await supabase.functions.invoke('send-recommendation', {
        body: {
          recommendation_id: recommendationId,
          channels,
          optional_message: optionalMessage || null,
          resend: isResend,
        },
      });

      if (error) throw error;

      setResult(data);

      if (data.success) {
        // Track GA4 event
        trackEvent('send_recommendation', {
          recommendation_id: recommendationId,
          channels: channels,
          is_resend: isResend,
          email_success: data.results?.email?.success || false,
          line_success: data.results?.line?.success || false,
        });
        
        toast({
          title: isResend ? 'Recommendation Resent' : 'Recommendation Sent',
          description: 'Patient has been notified successfully',
        });
        onSuccess();
      } else {
        // Create detailed error message for toast
        const failedChannels = [];
        if (data.results?.email && !data.results.email.success) {
          failedChannels.push(`Email: ${data.results.email.error}`);
        }
        if (data.results?.line && !data.results.line.success) {
          failedChannels.push(`LINE: ${data.results.line.error}`);
        }
        
        toast({
          title: 'Send Failed',
          description: failedChannels.join(' | ') || 'Some notifications failed. See details below.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error sending recommendation:', error);
      console.error('Error details:', {
        status: error?.status,
        code: error?.code,
        message: error?.message,
        context: error?.context,
        details: error?.details
      });
      
      const status = error?.status || error?.code;
      const detail = error?.message || error?.details || (typeof error === 'string' ? error : 'Failed to send recommendation');
      
      toast({
        title: status ? `Send Failed (${status})` : 'Send Failed',
        description: typeof detail === 'string' ? detail : JSON.stringify(detail),
        variant: 'destructive',
      });
      
      // Show error in results
      const errorChannels: any = {};
      if (sendEmail) errorChannels.email = { success: false, error: detail };
      if (sendLine) errorChannels.line = { success: false, error: detail };
      
      setResult({
        success: false,
        results: errorChannels
      });
    } finally {
      setLoading(false);
    }
  };

  const isResend = recommendationStatus === 'sent';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isResend ? 'Resend Recommendation' : 'Send Recommendation'}</DialogTitle>
          <DialogDescription>
            Choose how to notify the patient about their prescription
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isResend && sentAt && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Previously sent</p>
              <p className="text-muted-foreground">
                Sent on {format(new Date(sentAt), 'MMM dd, yyyy')}
                {existingChannels && existingChannels.length > 0 && (
                  <> via {existingChannels.join(', ')}</>
                )}
              </p>
            </div>
          )}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(!!checked)}
                disabled={!emailAvailable || loading}
              />
              <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4" />
                Send via Email
                {!emailAvailable && <span className="text-xs text-muted-foreground">(Email not available or not consented)</span>}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="line"
                checked={sendLine}
                onCheckedChange={(checked) => setSendLine(!!checked)}
                disabled={!lineAvailable || loading}
              />
              <Label htmlFor="line" className="flex items-center gap-2 cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                Send via LINE
                {!lineAvailable && <span className="text-xs text-muted-foreground">(No LINE ID on file)</span>}
              </Label>
            </div>
          </div>

          {!emailAvailable && !lineAvailable && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg">
              No notification channels available for this patient. Please add an email or LINE ID to their profile.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Optional Personal Message</Label>
            <Textarea
              id="message"
              value={optionalMessage}
              onChange={(e) => setOptionalMessage(e.target.value)}
              placeholder="Add a personal message to the patient..."
              rows={3}
              maxLength={500}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{optionalMessage.length}/500 characters</p>
          </div>

          {result && (
            <div className="space-y-2">
              <p className="font-semibold text-sm">Results:</p>
              {sendEmail && (
                <div className="flex items-center gap-2 text-sm">
                  {result.results.email.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Email: {result.results.email.success ? 'Sent successfully' : result.results.email.error}</span>
                </div>
              )}
              {sendLine && (
                <div className="flex items-center gap-2 text-sm">
                  {result.results.line.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>LINE: {result.results.line.success ? 'Sent successfully' : result.results.line.error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {result?.success ? 'Close' : 'Cancel'}
          </Button>
          {!result?.success && (
            <Button onClick={handleSend} disabled={loading || (!sendEmail && !sendLine)}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isResend ? 'Resend Recommendation' : 'Send Recommendation'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}