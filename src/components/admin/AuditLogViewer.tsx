import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { FileEdit, UserPlus, Trash2, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  patient_id: string | null;
  record_type: string;
  record_id: string | null;
  details: any;
  created_at: string;
  profiles: {
    full_name: string;
  };
  patients?: {
    full_name: string;
  };
}

interface AuditLogViewerProps {
  patientId?: string;
  limit?: number;
}

export function AuditLogViewer({ patientId, limit = 50 }: AuditLogViewerProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', patientId],
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_log')
        .select(`
          *,
          patients:patient_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch admin profiles separately
      const adminIds = [...new Set(data.map(log => log.admin_id))];
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', adminIds);

      // Merge admin names
      const logsWithAdmins = data.map(log => ({
        ...log,
        profiles: adminProfiles?.find(p => p.id === log.admin_id) || { full_name: 'Unknown Admin' }
      }));

      return logsWithAdmins as AuditLog[];
    }
  });

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return <UserPlus className="h-4 w-4" />;
    if (action.includes('updated')) return <FileEdit className="h-4 w-4" />;
    if (action.includes('deleted')) return <Trash2 className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'default';
    if (action.includes('updated')) return 'secondary';
    if (action.includes('deleted')) return 'destructive';
    return 'outline';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No audit logs found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <Card key={log.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getActionIcon(log.action)}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={getActionColor(log.action) as any}>
                    {log.action.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {log.record_type}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="font-medium">{log.profiles?.full_name}</span>
                  {log.patients && (
                    <span className="text-muted-foreground">
                      {' '}• Patient: {log.patients.full_name}
                    </span>
                  )}
                </p>
                {log.details && (
                  <p className="text-xs text-muted-foreground">
                    {JSON.stringify(log.details)}
                  </p>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
