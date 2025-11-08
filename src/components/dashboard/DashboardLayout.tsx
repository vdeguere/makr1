import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { BottomNav } from '@/components/mobile/BottomNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex flex-col w-full">
        {/* Header at top spanning full width */}
        <DashboardHeader />
        
        {/* Content area with sidebar and main content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Desktop Sidebar - hidden on mobile and tablet */}
          <div className="hidden lg:block">
            <DashboardSidebar />
          </div>
          
          {/* Main Content */}
          <main className="flex-1 px-[clamp(0.75rem,3vw,1.5rem)] pt-fluid-2 pb-[calc(var(--sab)+5rem)] lg:pb-fluid-4 lg:p-fluid-4 bg-muted/20">
            {children}
          </main>
        </div>
        
        {/* Mobile & Tablet Bottom Nav - hidden on desktop */}
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
