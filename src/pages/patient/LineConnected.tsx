import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, MessageCircle, Bell } from 'lucide-react';
export default function LineConnected() {
  const navigate = useNavigate();
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <CardTitle>LINE Connected!</CardTitle>
          </div>
          <CardDescription>
            Your LINE account has been successfully connected to your health portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              You'll Now Receive:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>New prescription recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Order status updates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Important health notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Appointment reminders</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <a href="https://line.me/R/" target="_blank" rel="noopener noreferrer" className="block">
              
            </a>

            <Button onClick={() => navigate('/dashboard/patient/records')} className="w-full" size="lg">
              View My Health Records
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can manage your notification preferences in your account settings.
          </p>
        </CardContent>
      </Card>
    </div>;
}