import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'patient_created' 
  | 'patient_updated' 
  | 'patient_deleted'
  | 'visit_created'
  | 'visit_updated'
  | 'vital_signs_created'
  | 'vital_signs_updated'
  | 'document_uploaded'
  | 'document_deleted'
  | 'herb_created'
  | 'herb_updated'
  | 'herb_deleted';

interface LogAuditParams {
  action: AuditAction;
  patientId?: string;
  recordType: string;
  recordId?: string;
  details?: Record<string, any>;
}

export async function logAudit({ 
  action, 
  patientId, 
  recordType, 
  recordId, 
  details 
}: LogAuditParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user for audit log');
      return;
    }

    const { error } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: user.id,
        action,
        patient_id: patientId || null,
        record_type: recordType,
        record_id: recordId || null,
        details: details || null
      });

    if (error) {
      console.error('Error logging audit:', error);
    }
  } catch (error) {
    console.error('Error in logAudit:', error);
  }
}
