import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { User, LogOut, MessageCircle, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { TouchListItem } from '@/components/mobile/TouchOptimized';
import { cn } from '@/lib/utils';
import { RoleSwitcher } from '@/components/dev/RoleSwitcher';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import type { NavigationItem } from '@/lib/navigation';

interface MobileNavigationMenuProps {
  activeRole: string;
  role: string;
  label: string;
  menuItems: NavigationItem[];
  accountItems: NavigationItem[];
  onSignOut: () => void;
}

export function MobileNavigationMenu({
  activeRole,
  role,
  label,
  menuItems,
  accountItems,
  onSignOut,
}: MobileNavigationMenuProps) {
  const { t } = useTranslation('common');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (titleKey: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(titleKey)) {
        next.delete(titleKey);
      } else {
        next.add(titleKey);
      }
      return next;
    });
  };
  
  return (
    <>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base truncate">{t(label)}</div>
            <div className="text-xs text-muted-foreground">Charm Sense</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-8rem)] overflow-y-auto">
        <Separator />
        
        {/* Main Navigation */}
        <div className="py-2">
          <div className="px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('nav.main')}
          </div>
          
          {menuItems.map((item) => {
            if (item.children && item.children.length > 0) {
              const isExpanded = expandedItems.has(item.titleKey);
              return (
                <div key={item.titleKey}>
                  <TouchListItem
                    onClick={() => toggleItem(item.titleKey)}
                    className="px-6"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="flex-1 text-sm">{t(item.titleKey)}</span>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} 
                    />
                  </TouchListItem>
                  
                  {isExpanded && (
                    <div className="animate-accordion-down">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.url}
                          to={child.url!}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center w-full min-h-touch pl-12 pr-6 py-[clamp(0.625rem,1.5vh,0.875rem)]",
                              "rounded-lg transition-all duration-200 active:bg-muted/50 touch-manipulation",
                              isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted/30"
                            )
                          }
                        >
                          <child.icon className="h-4 w-4 mr-3" />
                          <span className="flex-1 text-xs">{t(child.titleKey)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <NavLink
                key={item.url}
                to={item.url!}
                end={item.url === '/dashboard'}
                className={({ isActive }) =>
                  cn(
                    "flex items-center w-full min-h-touch px-6 py-[clamp(0.75rem,2vh,1rem)]",
                    "rounded-lg transition-all duration-200 active:bg-muted/50 touch-manipulation",
                    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted/30"
                  )
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="flex-1 text-sm">{t(item.titleKey)}</span>
              </NavLink>
            );
          })}
        </div>

        <Separator />

        {/* Account Section */}
        <div className="py-2">
          <div className="px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('nav.account')}
          </div>
          
          {accountItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className={({ isActive }) =>
                cn(
                  "flex items-center w-full min-h-touch px-6 py-[clamp(0.75rem,2vh,1rem)]",
                  "rounded-lg transition-all duration-200 active:bg-muted/50 touch-manipulation",
                  isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted/30"
                )
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span className="flex-1 text-sm">{t(item.titleKey)}</span>
            </NavLink>
          ))}

          {role === 'dev' && (
            <div className="px-6 py-3">
              <div className="text-xs text-muted-foreground mb-2">Developer Mode</div>
              <RoleSwitcher compact />
            </div>
          )}
        </div>

        <Separator />

        {/* Preferences Section */}
        <div className="py-2">
          <div className="px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('nav.preferences')}
          </div>
          
          <TouchListItem
            onClick={() => {
              window.dispatchEvent(new Event('app:chat:open'));
            }}
            className="px-6"
          >
            <MessageCircle className="h-5 w-5 mr-3" />
            <span className="text-sm">AI Assistant</span>
          </TouchListItem>

          <div className="px-6 py-3">
            <Label className="text-xs text-muted-foreground mb-2 block">{t('labels.language')}</Label>
            <LanguageSelector />
          </div>
        </div>

        <Separator />

        {/* Sign Out */}
        <TouchListItem 
          onClick={onSignOut}
          className="px-6 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="text-sm font-medium">{t('nav.signOut')}</span>
        </TouchListItem>
      </div>
    </>
  );
}
