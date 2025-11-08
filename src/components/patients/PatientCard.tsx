import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, Calendar, FileText, AlertCircle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getPatientInitials } from '@/lib/avatarUtils';

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  medical_history: string | null;
  allergies: string | null;
  practitioner_id: string;
  user_id: string | null;
  line_user_id: string | null;
  email_consent: boolean | null;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  const navigate = useNavigate();

  const age = patient.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null;

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={patient.profile_picture_url || undefined} />
              <AvatarFallback>{getPatientInitials(patient.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{patient.full_name}</h3>
            {age && (
              <p className="text-sm text-muted-foreground">{age} years old</p>
            )}
            
            {/* Connection Status Indicators */}
            {(patient.line_user_id || (patient.email && patient.email_consent)) && (
              <div className="flex gap-1.5 mt-2">
                {patient.line_user_id && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <MessageCircle className="h-3 w-3" />
                    LINE
                  </Badge>
                )}
                {patient.email && patient.email_consent && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Mail className="h-3 w-3" />
                    Email
                  </Badge>
                )}
              </div>
            )}
            </div>
          </div>
          {patient.allergies && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Allergies
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {patient.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{patient.email}</span>
          </div>
        )}
        {patient.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{patient.phone}</span>
          </div>
        )}
        {patient.date_of_birth && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(patient.date_of_birth), 'MMM d, yyyy')}</span>
          </div>
        )}
        {patient.medical_history && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="truncate">Has medical history</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dashboard/patients/${patient.id}`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
