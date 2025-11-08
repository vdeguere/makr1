import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Users, 
  MessageCircle, 
  Leaf, 
  Heart,
  ShoppingCart,
  Menu,
  BarChart3
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/platformDetection';
import { useViewportDimensions } from '@/lib/viewportUtils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { getNavigationItems, getNavigationLabel, accountItems } from '@/lib/navigation';

interface NavItem {
  icon: typeof Home;
  labelKey: string;
  path: string;
}

const getNavItemsByRole = (role: string): NavItem[] => {
  switch (role) {
    case 'admin':
      return [
        { icon: Home, labelKey: 'nav.home', path: '/dashboard' },
        { icon: Package, labelKey: 'nav.orders', path: '/dashboard/orders' },
        { icon: Leaf, labelKey: 'nav.herbs', path: '/dashboard/herbs' },
        { icon: Users, labelKey: 'nav.users', path: '/dashboard/admin/users' },
      ];
    case 'practitioner':
      return [
        { icon: Home, labelKey: 'nav.home', path: '/dashboard' },
        { icon: Users, labelKey: 'nav.patients', path: '/dashboard/patients' },
        { icon: MessageCircle, labelKey: 'nav.messages', path: '/dashboard/practitioner/messages' },
        { icon: BarChart3, labelKey: 'nav.analytics', path: '/dashboard/practitioner/analytics' },
      ];
    case 'patient':
      return [
        { icon: Heart, labelKey: 'nav.health', path: '/dashboard/patient/records' },
        { icon: MessageCircle, labelKey: 'nav.messages', path: '/dashboard/patient/messages' },
        { icon: Leaf, labelKey: 'nav.products', path: '/dashboard/herbs' },
        { icon: ShoppingCart, labelKey: 'nav.orders', path: '/dashboard/patient/orders' },
      ];
    default:
      return [
        { icon: Home, labelKey: 'nav.home', path: '/dashboard' },
      ];
  }
};

export function BottomNav() {
  const { role, activeRole } = useRole();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const isMobile = useIsMobile();
  const { isLandscape } = useViewportDimensions();
  const [sheetOpen, setSheetOpen] = useState(false);
  
  if (!isMobile) return null;
  
  const navItems = getNavItemsByRole(activeRole);
  const menuItems = getNavigationItems(activeRole);
  const label = getNavigationLabel(activeRole);

  const handleNavClick = () => {
    triggerHaptic('light');
  };

  const handleSignOut = async () => {
    setSheetOpen(false);
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
    <nav 
      className={cn(
        "fixed z-50 lg:hidden animate-slide-up",
        isLandscape 
          ? "right-0 top-0 bottom-0 w-16 border-l" 
          : "bottom-0 left-0 right-0 border-t"
      )}
    >
      <div className={cn(
        "bg-background/95 backdrop-blur-lg border-border shadow-lg h-full",
        !isLandscape && "pb-safe h-bottom-nav"
      )}>
        <div className={cn(
          "flex items-center justify-around h-full",
          isLandscape 
            ? "flex-col py-[clamp(0.5rem,2vh,1rem)] px-2" 
            : "px-[clamp(0.5rem,2vw,1rem)] py-[clamp(0.5rem,1.5vh,0.75rem)]"
        )}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center rounded-lg transition-all duration-200",
                  "active:scale-95 touch-manipulation",
                  isLandscape 
                    ? "flex-col w-12 h-12 min-h-touch" 
                    : "flex-col w-[clamp(50px,16vw,70px)] h-[clamp(52px,90%,60px)]",
                  isActive 
                    ? "text-primary scale-105" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    className={cn(
                      "h-[clamp(20px,5vw,24px)] w-[clamp(20px,5vw,24px)] mb-1 transition-transform",
                      isActive && "scale-110"
                    )} 
                  />
                  <span className={cn(
                    "text-fluid-xs font-medium transition-all",
                    isActive && "font-semibold"
                  )}>
                    {t(item.labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          
          {/* More Button */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => {
                  handleNavClick();
                  setSheetOpen(true);
                }}
                className={cn(
                  "flex items-center justify-center rounded-lg transition-all duration-200",
                  "active:scale-95 touch-manipulation p-0 h-auto",
                  isLandscape 
                    ? "flex-col w-12 h-12 min-h-touch" 
                    : "flex-col w-[clamp(50px,16vw,70px)] h-[clamp(52px,90%,60px)]",
                  sheetOpen 
                    ? "text-primary scale-105" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Menu 
                  className={cn(
                    "h-[clamp(20px,5vw,24px)] w-[clamp(20px,5vw,24px)] mb-1 transition-transform",
                    sheetOpen && "scale-110"
                  )} 
                />
                <span className={cn(
                  "text-fluid-xs font-medium transition-all",
                  sheetOpen && "font-semibold"
                )}>
                  {t('nav.more')}
                </span>
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
      </div>
    </nav>
  );
}
