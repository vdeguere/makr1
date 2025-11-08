import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LiveMeetingPlayer as Player } from '@/components/live-meetings/LiveMeetingPlayer';
import { AttendeeList } from '@/components/live-meetings/AttendeeList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function LiveMeetingPlayer() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['live-meeting', meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
  });

  const { data: attendees } = useQuery({
    queryKey: ['meeting-attendees', meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_meeting_attendees')
        .select('*')
        .eq('meeting_id', meetingId)
        .is('left_at', null);

      if (error) throw error;
      return data;
    },
    enabled: !!meetingId,
    refetchInterval: 5000,
  });

  // Track attendance
  useEffect(() => {
    if (!meetingId || !user) return;

    const trackAttendance = async () => {
      const { error } = await supabase
        .from('live_meeting_attendees')
        .insert({
          meeting_id: meetingId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error && !error.message.includes('duplicate')) {
        console.error('Failed to track attendance:', error);
      }
    };

    trackAttendance();

    // Mark as left when component unmounts
    return () => {
      supabase
        .from('live_meeting_attendees')
        .update({ left_at: new Date().toISOString() })
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .is('left_at', null)
        .then();
    };
  }, [meetingId, user]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">Loading meeting...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!meeting) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-lg mb-4">Meeting not found</p>
            <Button onClick={() => navigate('/dashboard/live-meetings')}>
              Back to Meetings
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-fluid-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/live-meetings')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Meetings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-fluid-4">
          <div className="lg:col-span-3">
            <Player meeting={meeting} />
          </div>

          <div className="lg:col-span-1">
            <AttendeeList attendees={attendees || []} meetingId={meetingId!} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
