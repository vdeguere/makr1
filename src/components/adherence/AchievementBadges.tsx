import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface AchievementBadgesProps {
  patientId: string;
}

export function AchievementBadges({ patientId }: AchievementBadgesProps) {
  // Fetch all achievements
  const { data: allAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data;
    },
  });

  // Fetch patient's earned achievements
  const { data: earnedAchievements, isLoading: earnedLoading } = useQuery({
    queryKey: ['patient-achievements', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_achievements')
        .select('*, achievements(*)')
        .eq('patient_id', patientId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (achievementsLoading || earnedLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedIds = new Set(earnedAchievements?.map(ea => ea.achievement_id));

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-700';
      case 'silver': return 'text-slate-400';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-purple-500';
      default: return 'text-muted-foreground';
    }
  };

  const getIcon = (iconName: string): LucideIcon => {
    return (Icons as any)[iconName] || Icons.Award;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>
          {earnedAchievements?.length || 0} of {allAchievements?.length || 0} unlocked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allAchievements?.map((achievement) => {
            const isEarned = earnedIds.has(achievement.id);
            const Icon = getIcon(achievement.icon_name);

            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  isEarned
                    ? 'border-primary bg-primary/5'
                    : 'border-muted bg-muted/30 opacity-50'
                }`}
              >
                <div className={`inline-flex p-3 rounded-full mb-2 ${
                  isEarned ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <Icon 
                    className={`h-6 w-6 ${
                      isEarned ? getTierColor(achievement.tier) : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <div className="font-medium text-sm">{achievement.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {achievement.description}
                </div>
                {isEarned && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {achievement.tier}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
