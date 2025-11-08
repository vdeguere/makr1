import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LiveMeetingCard } from '@/components/live-meetings/LiveMeetingCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LiveMeetings() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['live-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_meetings')
        .select('*')
        .eq('is_published', true)
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const now = new Date();
  const liveMeetings = meetings?.filter(m => m.is_live_now) || [];
  const upcomingMeetings = meetings?.filter(m => 
    new Date(m.scheduled_start_time) > now && !m.is_live_now
  ) || [];
  const pastMeetings = meetings?.filter(m => 
    new Date(m.scheduled_start_time) <= now && !m.is_live_now
  ) || [];

  const filteredMeetings = (meetingList: any[]) => {
    if (!searchQuery) return meetingList;
    return meetingList.filter(meeting =>
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-fluid-6">
        <div>
          <h1 className="text-fluid-3xl font-bold mb-2">{t('nav.liveMeetings')}</h1>
          <p className="text-muted-foreground">
            Join live meetings and watch past recordings
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="live" className="gap-2">
              <Radio className="h-4 w-4" />
              Live Now ({liveMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming ({upcomingMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-fluid-4">
            {isLoading ? (
              <div className="text-center py-12">Loading meetings...</div>
            ) : filteredMeetings(liveMeetings).length === 0 ? (
              <div className="text-center py-12">
                <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No live meetings at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
                {filteredMeetings(liveMeetings).map((meeting) => (
                  <LiveMeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-fluid-4">
            {isLoading ? (
              <div className="text-center py-12">Loading meetings...</div>
            ) : filteredMeetings(upcomingMeetings).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming meetings scheduled</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
                {filteredMeetings(upcomingMeetings).map((meeting) => (
                  <LiveMeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-fluid-4">
            {isLoading ? (
              <div className="text-center py-12">Loading meetings...</div>
            ) : filteredMeetings(pastMeetings).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No past meetings available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
                {filteredMeetings(pastMeetings).map((meeting) => (
                  <LiveMeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
