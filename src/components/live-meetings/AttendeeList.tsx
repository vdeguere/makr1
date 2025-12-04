import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/lib/logger';

interface AttendeeListProps {
  attendees: Array<{
    id: string;
    user_id: string;
    joined_at: string;
    left_at: string | null;
  }>;
  meetingId: string;
}

interface Attendee {
  id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  profile: {
    full_name: string;
  };
}

export function AttendeeList({ attendees: initialAttendees, meetingId }: AttendeeListProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialAttendees) {
      enrichAttendees(initialAttendees);
    } else {
      fetchAttendees();
    }
  }, [meetingId, initialAttendees]);

  const enrichAttendees = async (rawAttendees: any[]) => {
    try {
      if (rawAttendees.length > 0) {
        const userIds = rawAttendees.map(a => a.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const enrichedData = rawAttendees.map(attendee => ({
          ...attendee,
          profile: profileMap.get(attendee.user_id) || { full_name: 'Unknown User' },
        }));
        
        setAttendees(enrichedData as Attendee[]);
      } else {
        setAttendees([]);
      }
    } catch (error) {
      logger.error('Error enriching attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('live_meeting_attendees')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(a => a.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const enrichedData = data.map(attendee => ({
          ...attendee,
          profile: profileMap.get(attendee.user_id) || { full_name: 'Unknown User' },
        }));
        
        setAttendees(enrichedData as Attendee[]);
      } else {
        setAttendees([]);
      }
    } catch (error) {
      logger.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeAttendees = attendees.filter(a => !a.left_at);
  const pastAttendees = attendees.filter(a => a.left_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Attendees ({attendees.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-fluid-4">
            {activeAttendees.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge variant="default">Active ({activeAttendees.length})</Badge>
                </h4>
                <div className="space-y-2">
                  {activeAttendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {attendee.profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {attendee.profile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Joined {formatDistanceToNow(new Date(attendee.joined_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        Online
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastAttendees.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge variant="secondary">Past ({pastAttendees.length})</Badge>
                </h4>
                <div className="space-y-2">
                  {pastAttendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {attendee.profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {attendee.profile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Left {formatDistanceToNow(new Date(attendee.left_at!), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && attendees.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No attendees yet
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
