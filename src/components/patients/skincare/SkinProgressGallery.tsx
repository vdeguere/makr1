import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface ProgressPhoto {
  id: string;
  url: string;
  date: string;
  notes?: string;
}

interface SkinProgressGalleryProps {
  patientId: string;
}

export function SkinProgressGallery({ patientId }: SkinProgressGalleryProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedPhotos, setSelectedPhotos] = useState<[ProgressPhoto | null, ProgressPhoto | null]>([null, null]);
  const [comparisonMode, setComparisonMode] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [patientId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      // Fetch wellness surveys with photos
      const { data, error } = await supabase
        .from('patient_wellness_surveys')
        .select('id, created_at, notes')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse photos from notes (stored as "Photos: url1, url2")
      const photoList: ProgressPhoto[] = [];
      data?.forEach(survey => {
        if (survey.notes && survey.notes.includes('Photos:')) {
          const photoUrls = survey.notes.split('Photos:')[1]?.trim().split(',') || [];
          photoUrls.forEach((url, idx) => {
            if (url.trim()) {
              photoList.push({
                id: `${survey.id}-${idx}`,
                url: url.trim(),
                date: survey.created_at,
                notes: survey.notes.split('Photos:')[0]?.trim() || undefined,
              });
            }
          });
        }
      });

      setPhotos(photoList);
    } catch (error) {
      logger.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    if (!selectedDateRange.from && !selectedDateRange.to) return true;
    const photoDate = new Date(photo.date);
    if (selectedDateRange.from && photoDate < selectedDateRange.from) return false;
    if (selectedDateRange.to && photoDate > selectedDateRange.to) return false;
    return true;
  });

  const handleSelectPhoto = (photo: ProgressPhoto) => {
    if (!selectedPhotos[0]) {
      setSelectedPhotos([photo, null]);
    } else if (!selectedPhotos[1]) {
      setSelectedPhotos([selectedPhotos[0], photo]);
      setComparisonMode(true);
    } else {
      setSelectedPhotos([photo, null]);
      setComparisonMode(false);
    }
  };

  const clearComparison = () => {
    setSelectedPhotos([null, null]);
    setComparisonMode(false);
  };

  if (loading) {
    return <div className="text-center p-8 text-muted-foreground">Loading progress photos...</div>;
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>No progress photos available yet.</p>
          <p className="text-sm mt-2">Photos will appear here after wellness check-ins with photo uploads.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skin Progress Gallery</CardTitle>
          <CardDescription>Track visual progress over time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Filter */}
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Filter by Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDateRange.from ? format(selectedDateRange.from, 'PPP') : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDateRange.from}
                      onSelect={(date) => setSelectedDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDateRange.to ? format(selectedDateRange.to, 'PPP') : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDateRange.to}
                      onSelect={(date) => setSelectedDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {(selectedDateRange.from || selectedDateRange.to) && (
                  <Button variant="ghost" onClick={() => setSelectedDateRange({})}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Comparison Mode */}
          {comparisonMode && selectedPhotos[0] && selectedPhotos[1] && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearComparison}>
                    Clear Comparison
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      {format(new Date(selectedPhotos[0].date), 'PPP')}
                    </div>
                    <img
                      src={selectedPhotos[0].url}
                      alt="Before"
                      className="w-full rounded-lg border-2 border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      {format(new Date(selectedPhotos[1].date), 'PPP')}
                    </div>
                    <img
                      src={selectedPhotos[1].url}
                      alt="After"
                      className="w-full rounded-lg border-2 border-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>All Photos ({filteredPhotos.length})</Label>
              {selectedPhotos[0] && !comparisonMode && (
                <Button variant="outline" size="sm" onClick={clearComparison}>
                  Clear Selection
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => {
                const isSelected = selectedPhotos[0]?.id === photo.id || selectedPhotos[1]?.id === photo.id;
                return (
                  <div
                    key={photo.id}
                    className={cn(
                      "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                      isSelected ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handleSelectPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={`Progress photo from ${format(new Date(photo.date), 'PPP')}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      {isSelected && (
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                          <ZoomIn className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white font-medium">
                        {format(new Date(photo.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

