import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, UserCog, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { role, activeRole, switchRole, loading } = useRole();
  const { toast } = useToast();

  // Wait for role to load before deciding visibility
  if (loading) return null;
  if (role !== 'dev' || !switchRole) return null;

  const handleSwitch = async (newRole: 'patient' | 'practitioner' | 'admin') => {
    await switchRole(newRole);
    toast({
      title: 'Role switched',
      description: `Now viewing as ${newRole}`,
    });
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'patient':
        return <User className="h-3 w-3" />;
      case 'practitioner':
        return <UserCog className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("px-4 py-2 bg-warning/10 border border-warning/30 rounded-lg", compact ? "flex flex-col gap-2" : "flex items-center gap-3")}>
      <Badge variant="outline" className="gap-1 bg-warning/20 border-warning text-warning-foreground">
        🔧 Dev Mode
      </Badge>
      
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>Viewing as:</span>
        <Badge variant="secondary" className="gap-1">
          {getRoleIcon(activeRole || '')}
          {activeRole}
        </Badge>
      </div>

      <div className={cn("flex gap-1", compact && "w-full flex-col")}>
        <Button
          size="sm"
          variant={activeRole === 'patient' ? 'default' : 'ghost'}
          onClick={() => handleSwitch('patient')}
          className={cn("h-7 gap-1", compact && "w-full justify-start")}
        >
          <User className="h-3 w-3" />
          Patient
        </Button>
        <Button
          size="sm"
          variant={activeRole === 'practitioner' ? 'default' : 'ghost'}
          onClick={() => handleSwitch('practitioner')}
          className={cn("h-7 gap-1", compact && "w-full justify-start")}
        >
          <UserCog className="h-3 w-3" />
          Practitioner
        </Button>
        <Button
          size="sm"
          variant={activeRole === 'admin' ? 'default' : 'ghost'}
          onClick={() => handleSwitch('admin')}
          className={cn("h-7 gap-1", compact && "w-full justify-start")}
        >
          <Shield className="h-3 w-3" />
          Admin
        </Button>
      </div>
    </div>
  );
}
