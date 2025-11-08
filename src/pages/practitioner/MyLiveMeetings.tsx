import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LiveMeetingFormDialog } from '@/components/live-meetings/LiveMeetingFormDialog';
import { LiveMeetingCard } from '@/components/live-meetings/LiveMeetingCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MyLiveMeetings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['my-live-meetings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_meetings')
        .select('*')
        .eq('host_user_id', user?.id)
        .order('scheduled_start_time', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const { error } = await supabase
        .from('live_meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-live-meetings'] });
      toast({ title: 'Meeting deleted successfully' });
      setDeleteDialogOpen(false);
      setMeetingToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const now = new Date();
  const upcomingMeetings = meetings?.filter(m => 
    new Date(m.scheduled_start_time) > now
  ) || [];
  const pastMeetings = meetings?.filter(m => 
    new Date(m.scheduled_start_time) <= now
  ) || [];

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedMeeting(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-fluid-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-fluid-3xl font-bold mb-2">My Live Meetings</h1>
            <p className="text-muted-foreground">
              Create and manage your live meetings
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Meeting
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming ({upcomingMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-fluid-4">
            {isLoading ? (
              <div className="text-center py-12">Loading meetings...</div>
            ) : upcomingMeetings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No upcoming meetings scheduled</p>
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Meeting
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
                {upcomingMeetings.map((meeting) => (
                  <LiveMeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    showHostInfo={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-fluid-4">
            {isLoading ? (
              <div className="text-center py-12">Loading meetings...</div>
            ) : pastMeetings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No past meetings</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
                {pastMeetings.map((meeting) => (
                  <LiveMeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    showHostInfo={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <LiveMeetingFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        meeting={selectedMeeting}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['my-live-meetings'] });
          handleFormClose();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this meeting. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => meetingToDelete && deleteMutation.mutate(meetingToDelete)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
