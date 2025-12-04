import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProgressMetricsManager } from '@/components/admin/ProgressMetricsManager';

export default function ProgressMetrics() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Metrics</h1>
          <p className="text-muted-foreground">
            Configure custom metrics for tracking student progress across different skills
          </p>
        </div>
        <ProgressMetricsManager />
      </div>
    </DashboardLayout>
  );
}

