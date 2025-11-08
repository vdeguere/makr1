import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Award, Calendar, Building2, FileText, ExternalLink, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CertificationCardProps {
  certification: any;
  onEdit: (cert: any) => void;
  onDelete: (id: string) => void;
}

export function CertificationCard({ certification, onEdit, onDelete }: CertificationCardProps) {
  const isExpiringSoon = certification.expiry_date && 
    new Date(certification.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  const isExpired = certification.expiry_date && 
    new Date(certification.expiry_date) < new Date();

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              {certification.certification_name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building2 className="h-4 w-4" />
              <span>{certification.issuing_organization}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={
                isExpired ? 'destructive' : 
                certification.is_verified ? 'default' : 
                'secondary'
              }>
                {isExpired ? 'Expired' : certification.status}
              </Badge>
              {certification.is_verified && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {isExpiringSoon && !isExpired && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Expiring Soon
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(certification)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(certification.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {certification.certification_number && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Certificate #:</span>
            <span className="font-medium">{certification.certification_number}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Issued:</span>
          <span>{format(new Date(certification.issue_date), 'MMM d, yyyy')}</span>
        </div>

        {certification.expiry_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Expires:</span>
            <span className={isExpired ? 'text-red-600 font-medium' : ''}>
              {format(new Date(certification.expiry_date), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </div>

      {certification.verification_url && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(certification.verification_url, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Verify Online
        </Button>
      )}
    </Card>
  );
}
