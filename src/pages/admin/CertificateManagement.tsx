import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Award, Search, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

export default function CertificateManagement() {
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    thisYear: 0
  });

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('course_certificates')
        .select(`
          *,
          courses (title)
        `)
        .order('issued_at', { ascending: false });

      if (error) throw error;

      setCertificates(data || []);

      // Calculate stats
      const now = new Date();
      const thisMonth = data?.filter((cert: any) => {
        const issued = new Date(cert.issued_at);
        return issued.getMonth() === now.getMonth() && issued.getFullYear() === now.getFullYear();
      }).length || 0;

      const thisYear = data?.filter((cert: any) => {
        const issued = new Date(cert.issued_at);
        return issued.getFullYear() === now.getFullYear();
      }).length || 0;

      setStats({
        total: data?.length || 0,
        thisMonth,
        thisYear
      });
    } catch (error) {
      logger.error('Error fetching certificates:', error);
      toast({
        title: "Error",
        description: "Failed to load certificates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const filteredCertificates = certificates.filter(cert => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cert.user_id?.toLowerCase().includes(searchLower) ||
      cert.courses?.title?.toLowerCase().includes(searchLower) ||
      cert.verification_code?.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    const headers = ['User ID', 'Course', 'Issued Date', 'Verification Code'];
    const rows = filteredCertificates.map(cert => [
      cert.user_id || 'N/A',
      cert.courses?.title || 'N/A',
      format(new Date(cert.issued_at), 'yyyy-MM-dd'),
      cert.verification_code
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Certificate Management</h1>
          <p className="text-muted-foreground">Manage and monitor all issued certificates</p>
        </div>
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold">{stats.thisMonth}</p>
              </div>
              <Award className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Year</p>
                <p className="text-3xl font-bold">{stats.thisYear}</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Search and Export */}
        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user ID, course, or verification code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Certificates Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Verification Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No certificates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <code className="text-xs">{cert.user_id}</code>
                      </TableCell>
                      <TableCell>{cert.courses?.title || 'N/A'}</TableCell>
                      <TableCell>
                        {format(new Date(cert.issued_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {cert.verification_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {cert.certificate_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(cert.certificate_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/verify-certificate?code=${cert.verification_code}`, '_blank')}
                          >
                            Verify
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
