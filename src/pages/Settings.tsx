import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { supabase } from '@/integrations/supabase/client';
import { profileSchema, ProfileFormData } from '@/lib/validations/auth';
import { CurrencySelector } from '@/components/CurrencySelector';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function Settings() {
  const { user } = useAuth();
  const { role } = useRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      reset({
        fullName: data.full_name || '',
        phone: data.phone || '',
        specialization: data.specialization || '',
        licenseNumber: data.license_number || ''
      });
    } catch (error: any) {
      toast({
        title: 'Error loading profile',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setFetchingProfile(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone || null,
          specialization: data.specialization || null,
          license_number: data.licenseNumber || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.'
      });
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and practitioner details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  placeholder="Dr. Jane Smith"
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+1 (555) 000-0000"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              {role === 'practitioner' && (
                <>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      {...register('specialization')}
                      placeholder="Traditional Thai Medicine"
                    />
                    {errors.specialization && (
                      <p className="text-sm text-destructive">{errors.specialization.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      {...register('licenseNumber')}
                      placeholder="TH-12345"
                    />
                    {errors.licenseNumber && (
                      <p className="text-sm text-destructive">{errors.licenseNumber.message}</p>
                    )}
                  </div>
                </>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Manage your language and currency preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <LanguageSelector />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <CurrencySelector />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
