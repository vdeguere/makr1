import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PatientsList } from '@/components/patients/PatientsList';

export default function Patients() {
  return (
    <DashboardLayout>
      <div className="space-y-3 md:space-y-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">
            Manage and view patient information
          </p>
        </div>
        <PatientsList />
      </div>
    </DashboardLayout>
  );
}
