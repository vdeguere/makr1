import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRole } from '@/contexts/RoleContext';
import { useTranslation } from 'react-i18next';
import { getNavigationItems, getNavigationLabel, accountItems } from '@/lib/navigation';
import { Badge } from '@/components/ui/badge';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';

// Helper function to determine which groups should be open based on active route
const getInitialOpenGroups = (pathname: string, menuItems: any[]): Record<string, boolean> => {
  const openGroups: Record<string, boolean> = {};
  
  menuItems.forEach(item => {
    if (item.children) {
      // Check if any child URL matches the current pathname
      const hasActiveChild = item.children.some((child: any) => 
        pathname.startsWith(child.url)
      );
      if (hasActiveChild) {
        openGroups[item.titleKey] = true;
      }
    }
  });
  
  // Try to restore from localStorage
  const stored = localStorage.getItem('sidebarOpenGroups');
  if (stored) {
    try {
      const storedGroups = JSON.parse(stored);
      // Merge with the active route groups (active route takes precedence)
      return { ...storedGroups, ...openGroups };
    } catch (e) {
      // If parsing fails, just return the openGroups
      return openGroups;
    }
  }
  
  return openGroups;
};

export function DashboardSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const { activeRole } = useRole();
  const { t } = useTranslation('common');
  const location = useLocation();
  const unreadCount = useUnreadMessagesCount();
  
  const menuItems = getNavigationItems(activeRole);
  const label = getNavigationLabel(activeRole);
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => 
    getInitialOpenGroups(location.pathname, menuItems)
  );

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const newGroups = { ...prev, [key]: !prev[key] };
      localStorage.setItem('sidebarOpenGroups', JSON.stringify(newGroups));
      return newGroups;
    });
  };

  // Keep groups with active children open when navigating
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some((child: any) => 
          location.pathname.startsWith(child.url)
        );
        if (hasActiveChild && !openGroups[item.titleKey]) {
          setOpenGroups(prev => {
            const newGroups = { ...prev, [item.titleKey]: true };
            localStorage.setItem('sidebarOpenGroups', JSON.stringify(newGroups));
            return newGroups;
          });
        }
      }
    });
  }, [location.pathname, menuItems]);

  // Keyboard shortcut: Ctrl/Cmd + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {t(label)}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={0}>
                {menuItems.map((item) => {
                  if (item.children) {
                    // When collapsed, use Popover; when expanded, use Collapsible
                    if (!open) {
                      return (
                        <SidebarMenuItem key={item.titleKey}>
                          <Popover>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                  <SidebarMenuButton>
                                    <item.icon className="h-4 w-4" />
                                  </SidebarMenuButton>
                                </PopoverTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {t(item.titleKey)}
                              </TooltipContent>
                            </Tooltip>
                            <PopoverContent side="right" align="start" className="w-48 p-2">
                              <div className="space-y-1">
                                {item.children.map((child) => (
                                  <NavLink
                                    key={child.titleKey}
                                    to={child.url!}
                                    className={({ isActive }) =>
                                      `flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                                        isActive
                                          ? 'bg-accent text-accent-foreground'
                                          : 'hover:bg-accent/50'
                                      }`
                                    }
                                  >
                                    <child.icon className="h-4 w-4" />
                                    <span>{t(child.titleKey)}</span>
                                  </NavLink>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <Collapsible
                        key={item.titleKey}
                        open={openGroups[item.titleKey]}
                        onOpenChange={() => toggleGroup(item.titleKey)}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <item.icon className="h-4 w-4" />
                              <span>{t(item.titleKey)}</span>
                              <ChevronDown
                                className={`ml-auto h-4 w-4 transition-transform ${
                                  openGroups[item.titleKey] ? 'rotate-180' : ''
                                }`}
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.titleKey}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink
                                      to={child.url!}
                                      className={({ isActive }) =>
                                        isActive ? 'bg-accent text-accent-foreground' : ''
                                      }
                                    >
                                      <child.icon className="h-4 w-4" />
                                      <span>{t(child.titleKey)}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  const isMessagesItem = item.url?.includes('/messages');
                  const showBadge = isMessagesItem && unreadCount > 0;

                  return (
                    <SidebarMenuItem key={item.titleKey}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url!}
                              end={item.url === '/dashboard'}
                              className={({ isActive }) =>
                                isActive ? 'bg-accent text-accent-foreground' : ''
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              {open && (
                                <span className="flex items-center gap-2">
                                  {t(item.titleKey)}
                                  {showBadge && (
                                    <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center px-1">
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </span>
                              )}
                              {!open && showBadge && (
                                <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 min-w-4 flex items-center justify-center px-1 text-xs">
                                  {unreadCount}
                                </Badge>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {!open && (
                          <TooltipContent side="right">
                            {t(item.titleKey)}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.account')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={0}>
                {accountItems.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url!}
                            className={({ isActive }) =>
                              isActive ? 'bg-accent text-accent-foreground' : ''
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            {open && <span>{t(item.titleKey)}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!open && (
                        <TooltipContent side="right">
                          {t(item.titleKey)}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
