import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LiveMeetingFormDialog } from '@/components/live-meetings/LiveMeetingFormDialog';
import { MeetingStats } from '@/components/live-meetings/MeetingStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Pencil, Trash2, Eye, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
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

export default function LiveMeetingManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['admin-live-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_meetings')
        .select('*')
        .order('scheduled_start_time', { ascending: false });

      if (error) throw error;
      return data;
    },
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
      queryClient.invalidateQueries({ queryKey: ['admin-live-meetings'] });
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

  const toggleLiveMutation = useMutation({
    mutationFn: async ({ id, isLive }: { id: string; isLive: boolean }) => {
      const { error } = await supabase
        .from('live_meetings')
        .update({ is_live_now: isLive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-live-meetings'] });
      toast({ title: 'Meeting status updated' });
    },
  });

  const handleEdit = (meeting: any) => {
    setSelectedMeeting(meeting);
    setFormOpen(true);
  };

  const handleDelete = (meetingId: string) => {
    setMeetingToDelete(meetingId);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedMeeting(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-fluid-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-fluid-3xl font-bold mb-2">Manage Live Meetings</h1>
            <p className="text-muted-foreground">
              Create and manage live meetings for your community
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Meeting
          </Button>
        </div>

        <MeetingStats meetings={meetings || []} />

        <Card>
          <CardHeader>
            <CardTitle>All Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading meetings...</div>
            ) : !meetings?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No meetings created yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Scheduled Start</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((meeting) => (
                    <TableRow key={meeting.id}>
                      <TableCell className="font-medium">
                        {meeting.title}
                      </TableCell>
                      <TableCell className="capitalize">
                        {meeting.stream_platform || 'Custom'}
                      </TableCell>
                      <TableCell>
                        {new Date(meeting.scheduled_start_time).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {meeting.is_live_now ? (
                          <Badge variant="destructive">
                            <Radio className="h-3 w-3 mr-1 animate-pulse" />
                            LIVE
                          </Badge>
                        ) : new Date(meeting.scheduled_start_time) > new Date() ? (
                          <Badge variant="secondary">Upcoming</Badge>
                        ) : (
                          <Badge variant="outline">Past</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {meeting.is_published ? (
                          <Badge variant="default">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/dashboard/live-meetings/${meeting.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(meeting)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toggleLiveMutation.mutate({
                                  id: meeting.id,
                                  isLive: !meeting.is_live_now,
                                })
                              }
                            >
                              <Radio className="h-4 w-4 mr-2" />
                              {meeting.is_live_now ? 'Stop Live' : 'Start Live'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(meeting.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <LiveMeetingFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        meeting={selectedMeeting}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-live-meetings'] });
          handleFormClose();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this meeting and all associated data.
              This action cannot be undone.
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
