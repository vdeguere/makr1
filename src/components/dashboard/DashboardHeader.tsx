import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Menu } from 'lucide-react';
import { RoleSwitcher } from '@/components/dev/RoleSwitcher';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileNavigationMenu } from '@/components/mobile/MobileNavigationMenu';
import { getNavigationItems, getNavigationLabel, accountItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function DashboardHeader() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { role, activeRole } = useRole();
  const { toast } = useToast();
  const { open: sidebarOpen } = useSidebar();

  const menuItems = getNavigationItems(activeRole);
  const label = getNavigationLabel(activeRole);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.'
      });
      navigate('/auth');
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 h-header border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-[clamp(1rem,4vw,2rem)] gap-fluid-2 pt-safe transition-all duration-200",
      "lg:ml-0",
      sidebarOpen && "lg:ml-[14.4rem]"
    )}>
      <div className="flex items-center gap-fluid-1 min-w-0">
        <div className="hidden md:block">
          <SidebarTrigger className="ml-1" />
        </div>
        <h1 className="text-fluid-lg sm:text-fluid-xl font-semibold truncate">
          <span className="hidden sm:inline">Makr Academy</span>
          <span className="sm:hidden">Dashboard</span>
        </h1>
        {import.meta.env.DEV && (
          <Badge variant="secondary" className="whitespace-nowrap">
            Role: {String(activeRole ?? 'unknown')}
          </Badge>
        )}
      </div>
      
      {/* Desktop view - show inline */}
      <div className="hidden lg:flex items-center gap-4">
        {role === 'dev' && <RoleSwitcher />}
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="shrink-0">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Mobile/Tablet view - Sheet drawer */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0 h-10 w-10 p-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
            <MobileNavigationMenu
              activeRole={activeRole}
              role={role}
              label={label}
              menuItems={menuItems}
              accountItems={accountItems}
              onSignOut={handleSignOut}
            />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
