import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Radio, Users, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface LiveMeetingCardProps {
  meeting: {
    id: string;
    title: string;
    description?: string | null;
    stream_platform?: string | null;
    scheduled_start_time: string;
    is_live_now: boolean;
    max_attendees?: number | null;
    host_user_id: string;
  };
  showHostInfo?: boolean;
}

export function LiveMeetingCard({ meeting, showHostInfo = false }: LiveMeetingCardProps) {
  const navigate = useNavigate();
  const startTime = new Date(meeting.scheduled_start_time);
  const isUpcoming = startTime > new Date();

  const getPlatformIcon = (platform?: string | null) => {
    switch (platform) {
      case 'youtube':
        return '🎥';
      case 'zoom':
        return '📹';
      case 'google_meet':
        return '📞';
      default:
        return '🎬';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-fluid-lg font-semibold line-clamp-2">
              {meeting.title}
            </h3>
            {meeting.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {meeting.description}
              </p>
            )}
          </div>
          
          {meeting.is_live_now && (
            <Badge variant="destructive">
              <Radio className="h-3 w-3 mr-1 animate-pulse" />
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-fluid-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getPlatformIcon(meeting.stream_platform)}</span>
            <span className="capitalize">{meeting.stream_platform || 'Custom'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {isUpcoming ? (
              <span>Starts {formatDistanceToNow(startTime, { addSuffix: true })}</span>
            ) : (
              <span>{startTime.toLocaleString()}</span>
            )}
          </div>

          {meeting.max_attendees && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Up to {meeting.max_attendees}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => navigate(`/dashboard/live-meetings/${meeting.id}`)}
          className="w-full"
          variant={meeting.is_live_now ? "default" : "outline"}
        >
          <Video className="h-4 w-4 mr-2" />
          {meeting.is_live_now ? 'Join Now' : 'View Details'}
        </Button>
      </CardFooter>
    </Card>
  );
}
