import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Radio, Users } from 'lucide-react';

interface LiveMeetingPlayerProps {
  meeting: {
    id: string;
    title: string;
    description?: string | null;
    stream_url: string;
    stream_platform?: string | null;
    scheduled_start_time: string;
    scheduled_end_time?: string | null;
    is_live_now: boolean;
    max_attendees?: number | null;
  };
}

export function LiveMeetingPlayer({ meeting }: LiveMeetingPlayerProps) {
  const getPlatformEmbedUrl = (url: string, platform?: string | null) => {
    if (platform === 'youtube' && url.includes('watch?v=')) {
      const videoId = url.split('watch?v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  return (
    <div className="space-y-fluid-4">
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black">
            <iframe
              src={getPlatformEmbedUrl(meeting.stream_url, meeting.stream_platform)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <div className="p-fluid-4 space-y-fluid-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-fluid-2xl font-bold mb-2">{meeting.title}</h1>
                {meeting.description && (
                  <p className="text-muted-foreground">{meeting.description}</p>
                )}
              </div>
              
              {meeting.is_live_now && (
                <Badge variant="destructive" className="flex-shrink-0">
                  <Radio className="h-3 w-3 mr-1 animate-pulse" />
                  LIVE NOW
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(meeting.scheduled_start_time).toLocaleString()}
                </span>
              </div>
              
              {meeting.max_attendees && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Max {meeting.max_attendees} attendees</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
