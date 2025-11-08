import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, UserCog, Users, Stethoscope, Crown, Plus } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: 'dev' | 'admin' | 'practitioner' | 'patient' | null;
  created_at: string;
  license_number?: string | null;
  specialization?: string | null;
  phone?: string | null;
}

export default function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, string>>({});
  const [savingRoleChanges, setSavingRoleChanges] = useState<Record<string, boolean>>({});
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'patient' as 'admin' | 'practitioner' | 'patient',
    licenseNumber: '',
    specialization: '',
    phone: ''
  });

  const { activeRole, loading: roleLoading } = useRole();

  useEffect(() => {
    if (roleLoading) return;
    
    if (activeRole !== 'admin' && activeRole !== 'dev') {
      navigate('/dashboard');
      return;
    }
    
    fetchUsers();
  }, [activeRole, roleLoading, navigate]);

  const fetchUsers = async () => {
    try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at, license_number, specialization, phone');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null,
        };
      }) || [];

      setUsers(usersWithRoles);
      
      // Track GA4 event
      trackEvent('manage_users', {
        total_users: usersWithRoles.length,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'practitioner' | 'patient') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id,role' });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveRole = async (userId: string, newRole: string) => {
    setSavingRoleChanges(prev => ({ ...prev, [userId]: true }));
    await updateUserRole(userId, newRole as 'admin' | 'practitioner' | 'patient');
    setPendingRoleChanges(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
    setSavingRoleChanges(prev => ({ ...prev, [userId]: false }));
  };

  const handleCancelRoleChange = (userId: string) => {
    setPendingRoleChanges(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.fullName) {
      toast({
        title: "Validation Error",
        description: "Email, password, and full name are required",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: `User ${newUser.fullName} created successfully`,
      });

      setCreateDialogOpen(false);
      setNewUser({
        email: '',
        password: '',
        fullName: '',
        role: 'patient',
        licenseNumber: '',
        specialization: '',
        phone: ''
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'practitioner':
        return 'default';
      case 'patient':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const filteredUsers = (roleFilter: string | null) => {
    if (!roleFilter) return users;
    return users.filter(u => u.role === roleFilter);
  };

  const renderUserCard = (userItem: UserWithRole, showPractitionerDetails = false) => {
    const hasPendingChange = userItem.id in pendingRoleChanges;
    const pendingRole = hasPendingChange ? pendingRoleChanges[userItem.id] : userItem.role;
    const isSaving = savingRoleChanges[userItem.id] || false;

    return (
      <div
        key={userItem.id}
        className="flex items-start justify-between p-4 border rounded-lg"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium">{userItem.full_name}</p>
          </div>
          <p className="text-sm text-muted-foreground">{userItem.email}</p>
          {showPractitionerDetails && userItem.role === 'practitioner' && (
            <div className="mt-2 space-y-1">
              {userItem.license_number && (
                <p className="text-sm"><span className="font-medium">License:</span> {userItem.license_number}</p>
              )}
              {userItem.specialization && (
                <p className="text-sm"><span className="font-medium">Specialization:</span> {userItem.specialization}</p>
              )}
              {userItem.phone && (
                <p className="text-sm"><span className="font-medium">Phone:</span> {userItem.phone}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getRoleBadgeVariant(userItem.role)}>
            {userItem.role || 'No Role'}
          </Badge>
          <Select
            value={pendingRole || undefined}
            onValueChange={(value) => {
              setPendingRoleChanges(prev => ({
                ...prev,
                [userItem.id]: value
              }));
            }}
            disabled={isSaving}
          >
            <SelectTrigger className={`w-[180px] ${hasPendingChange ? 'border-primary' : ''}`}>
              <SelectValue placeholder="Assign role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="practitioner">Practitioner</SelectItem>
              <SelectItem value="patient">Patient</SelectItem>
            </SelectContent>
          </Select>
          {hasPendingChange && (
            <>
              <Button 
                size="sm" 
                onClick={() => handleSaveRole(userItem.id, pendingRole)}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleCancelRoleChange(userItem.id)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Manage user roles and permissions</p>
            </div>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system with their role and information
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="practitioner">Practitioner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+66 123 456 7890"
                  />
                </div>
                {newUser.role === 'practitioner' && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={newUser.licenseNumber}
                        onChange={(e) => setNewUser({ ...newUser, licenseNumber: e.target.value })}
                        placeholder="TH-12345"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={newUser.specialization}
                        onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                        placeholder="Traditional Thai Medicine"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createUser} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="practitioners" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Practitioners ({filteredUsers('practitioner').length})
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-2">
              <Crown className="h-4 w-4" />
              Admins ({filteredUsers('admin').length})
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-2">
              <UserCog className="h-4 w-4" />
              Patients ({filteredUsers('patient').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage all users across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length > 0 ? (
                    users.map((userItem) => renderUserCard(userItem))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No users found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practitioners">
            <Card>
              <CardHeader>
                <CardTitle>Practitioners</CardTitle>
                <CardDescription>Manage practitioner accounts and credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers('practitioner').length > 0 ? (
                    filteredUsers('practitioner').map((userItem) => renderUserCard(userItem, true))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No practitioners found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Administrators</CardTitle>
                <CardDescription>Manage admin accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers('admin').length > 0 ? (
                    filteredUsers('admin').map((userItem) => renderUserCard(userItem))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No administrators found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle>Patients</CardTitle>
                <CardDescription>Manage patient accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers('patient').length > 0 ? (
                    filteredUsers('patient').map((userItem) => renderUserCard(userItem))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No patients found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
