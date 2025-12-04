import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logger } from '@/lib/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Search, Eye, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  is_read: boolean;
  admin_notes: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'spam';
}

export default function ContactSubmissions() {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['contact-submissions', statusFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContactSubmission[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: any = { status, is_read: true };
      if (notes !== undefined) {
        updateData.admin_notes = notes || null;
      }
      const { error } = await (supabase as any)
        .from('contact_submissions')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast.success('Status updated successfully');
      setSelectedSubmission(null);
      setAdminNotes('');
    },
    onError: (error) => {
      logger.error('Error updating status:', error);
      toast.error('Failed to update status');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('contact_submissions')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
    },
  });

  const handleViewSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || '');
    if (!submission.is_read) {
      markAsReadMutation.mutate(submission.id);
    }
  };

  const filteredSubmissions = submissions?.filter(submission =>
    submission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.message.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: 'default',
      in_progress: 'secondary',
      resolved: 'outline',
      spam: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status === 'new' && <AlertCircle className="mr-1 h-3 w-3" />}
        {status === 'in_progress' && <Clock className="mr-1 h-3 w-3" />}
        {status === 'resolved' && <CheckCircle className="mr-1 h-3 w-3" />}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const unreadCount = submissions?.filter(s => !s.is_read).length || 0;
  const newCount = submissions?.filter(s => s.status === 'new').length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contact Form Submissions</h1>
          <p className="text-muted-foreground">
            Manage inquiries from the public contact form
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>New</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{newCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unread</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No submissions found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow
                        key={submission.id}
                        className={!submission.is_read ? 'bg-muted/50' : ''}
                      >
                        <TableCell className="font-medium">{submission.name}</TableCell>
                        <TableCell>
                          <a
                            href={`mailto:${submission.email}`}
                            className="text-primary hover:underline"
                          >
                            {submission.email}
                          </a>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {submission.subject}
                        </TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>
                          {format(new Date(submission.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Submission Dialog */}
        <Dialog
          open={!!selectedSubmission}
          onOpenChange={(open) => !open && setSelectedSubmission(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contact Submission</DialogTitle>
              <DialogDescription>
                Submitted on {selectedSubmission && format(new Date(selectedSubmission.created_at), 'PPpp')}
              </DialogDescription>
            </DialogHeader>

            {selectedSubmission && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{selectedSubmission.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">
                      <a
                        href={`mailto:${selectedSubmission.email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedSubmission.email}
                      </a>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subject</label>
                    <p className="text-sm">{selectedSubmission.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                    {selectedSubmission.message}
                  </div>
                </div>

                {selectedSubmission.ip_address && (
                  <div className="text-xs text-muted-foreground">
                    IP: {selectedSubmission.ip_address}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this submission..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Select
                    value={selectedSubmission.status}
                    onValueChange={(value) => {
                      updateStatusMutation.mutate({
                        id: selectedSubmission.id,
                        status: value,
                        notes: adminNotes,
                      });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      updateStatusMutation.mutate({
                        id: selectedSubmission.id,
                        status: selectedSubmission.status,
                        notes: adminNotes,
                      });
                    }}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save Notes'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

