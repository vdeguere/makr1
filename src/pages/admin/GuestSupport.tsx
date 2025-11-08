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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, MessageSquare, Search, Eye, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface GuestSupportMessage {
  id: string;
  email: string;
  full_name: string | null;
  subject: string;
  message_body: string;
  chat_history: any;
  created_at: string;
  is_read: boolean;
  status: 'open' | 'in_progress' | 'resolved';
  admin_reply: string | null;
  replied_at: string | null;
  replied_by: string | null;
}

export default function GuestSupport() {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<GuestSupportMessage | null>(null);
  const [reply, setReply] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: messages, isLoading } = useQuery({
    queryKey: ['guest-support-messages', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('guest_support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GuestSupportMessage[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('guest_support_messages')
        .update({ status, is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-support-messages'] });
      toast.success('Status updated successfully');
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('guest_support_messages')
        .update({
          admin_reply: reply,
          replied_at: new Date().toISOString(),
          replied_by: user?.id,
          status: 'resolved',
          is_read: true,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-support-messages'] });
      toast.success('Reply sent successfully');
      setSelectedMessage(null);
      setReply('');
    },
    onError: (error) => {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    },
  });

  const filteredMessages = messages?.filter((msg) =>
    msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'secondary',
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Guest Support Messages</h1>
          <p className="text-muted-foreground">
            Manage support requests from non-patient users
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or subject..."
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
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
            <CardDescription>
              {filteredMessages?.length || 0} message(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredMessages && filteredMessages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{message.full_name || 'Anonymous'}</div>
                          <div className="text-sm text-muted-foreground">{message.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!message.is_read && (
                            <Badge variant="default" className="h-2 w-2 p-0" />
                          )}
                          {message.subject}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(message.created_at), 'PP')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMessage(message)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {message.status !== 'resolved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: message.id,
                                  status: message.status === 'open' ? 'in_progress' : 'resolved',
                                })
                              }
                            >
                              {message.status === 'open' ? (
                                <Clock className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No messages found
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMessage?.subject}</DialogTitle>
              <DialogDescription>
                From: {selectedMessage?.full_name || 'Anonymous'} ({selectedMessage?.email})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Message</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedMessage?.message_body}</p>
              </div>

              {selectedMessage?.chat_history && (
                <div>
                  <h4 className="font-semibold mb-2">AI Chat History</h4>
                  <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto space-y-2">
                    {selectedMessage.chat_history.map((msg: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <strong>{msg.role === 'user' ? 'User' : 'AI'}:</strong> {msg.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMessage?.admin_reply ? (
                <div>
                  <h4 className="font-semibold mb-2">Your Reply</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {selectedMessage.admin_reply}
                  </p>
                  {selectedMessage.replied_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Replied on {format(new Date(selectedMessage.replied_at), 'PPpp')}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold mb-2">Reply</h4>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={5}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMessage(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        selectedMessage &&
                        replyMutation.mutate({ id: selectedMessage.id, reply })
                      }
                      disabled={!reply.trim() || replyMutation.isPending}
                    >
                      {replyMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}