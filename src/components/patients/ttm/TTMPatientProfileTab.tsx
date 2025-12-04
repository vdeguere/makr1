import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Save, Loader2, CalendarIcon, Download, History, Clock } from "lucide-react";
import { format } from "date-fns";
import { LifestyleAssessment, type LifestyleData } from "../skincare/LifestyleAssessment";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";

interface TTMPatientProfileTabProps {
  patientId: string;
}

// Helper functions for calculations
const calculateAge = (birthDate: string | null) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const calculateDayOfWeekBorn = (birthDate: string | null, birthTime: string | null): string | null => {
  if (!birthDate) return null;
  
  const date = new Date(birthDate);
  
  // Apply the 6am rule: if born before 6am, use previous day
  if (birthTime) {
    const [hours] = birthTime.split(':').map(Number);
    if (hours < 6) {
      date.setDate(date.getDate() - 1);
    }
  }
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const getDayOfWeekIndex = (birthDate: string | null, birthTime: string | null): number => {
  if (!birthDate) return 0;
  
  const date = new Date(birthDate);
  
  // Apply the 6am rule: if born before 6am, use previous day
  if (birthTime) {
    const [hours] = birthTime.split(':').map(Number);
    if (hours < 6) {
      date.setDate(date.getDate() - 1);
    }
  }
  
  return date.getDay(); // 0 = Sunday, 6 = Saturday
};

const calculateThaiLunarDay = (birthDate: string | null) => {
  if (!birthDate) return null;
  
  const date = new Date(birthDate);
  const year = date.getFullYear();
  
  // Simplified lunar day calculation (approximate)
  const daysSinceNewYear = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const lunarDay = ((daysSinceNewYear % 30) + 1);
  const lunarMonth = Math.floor(daysSinceNewYear / 30) + 1;
  
  return `Day ${lunarDay}, Month ${lunarMonth}`;
};

// Pythagorean numerology mapping
const numerologyMap: { [key: string]: number } = {
  'A': 1, 'J': 1, 'S': 1,
  'B': 2, 'K': 2, 'T': 2,
  'C': 3, 'L': 3, 'U': 3,
  'D': 4, 'M': 4, 'V': 4,
  'E': 5, 'N': 5, 'W': 5,
  'F': 6, 'O': 6, 'X': 6,
  'G': 7, 'P': 7, 'Y': 7,
  'H': 8, 'Q': 8,
  'I': 9, 'R': 9
};

const convertToNumerology = (name: string): string => {
  return name
    .toUpperCase()
    .split('')
    .map(char => numerologyMap[char] || '')
    .join('');
};

// Base sequence for grid (clockwise from top-left, center empty)
const BASE_SEQUENCE = [1, 2, 3, 4, 7, 5, 8, 6];

// Rotate sequence right by n positions
const rotateSequence = (sequence: number[], positions: number): number[] => {
  const normalizedPositions = positions % 8;
  return [
    ...sequence.slice(normalizedPositions),
    ...sequence.slice(0, normalizedPositions)
  ];
};

// Get base grid for day of week (0 = Sunday, 6 = Saturday)
const getBaseGrid = (dayOfWeek: number): number[] => {
  return rotateSequence(BASE_SEQUENCE, dayOfWeek);
};

// Calculate current age in years at a specific reference date
const calculateCurrentAge = (birthDate: string, referenceDate: Date = new Date()): number => {
  const birth = new Date(birthDate);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Calculate months since birthday at reference date
const calculateMonthsSinceBirthday = (birthDate: string, referenceDate: Date = new Date()): number => {
  const birth = new Date(birthDate);
  const birthDay = birth.getDate();
  const referenceDay = referenceDate.getDate();
  
  let months = 0;
  let currentMonth = birth.getMonth();
  let currentYear = birth.getFullYear();
  
  while (currentYear < referenceDate.getFullYear() || 
         (currentYear === referenceDate.getFullYear() && currentMonth < referenceDate.getMonth()) ||
         (currentYear === referenceDate.getFullYear() && currentMonth === referenceDate.getMonth() && referenceDay >= birthDay)) {
    
    if (currentMonth === referenceDate.getMonth() && currentYear === referenceDate.getFullYear()) {
      if (referenceDay >= birthDay) {
        break;
      }
    }
    
    months++;
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    
    if (currentYear > referenceDate.getFullYear()) break;
    if (currentYear === referenceDate.getFullYear() && currentMonth > referenceDate.getMonth()) break;
  }
  
  return months;
};

// Calculate days since birth day of current month at reference date
const calculateDaysSinceBirthDay = (birthDate: string, referenceDate: Date = new Date()): number => {
  const birth = new Date(birthDate);
  const birthDay = birth.getDate();
  const referenceDay = referenceDate.getDate();
  
  if (referenceDay >= birthDay) {
    return referenceDay - birthDay;
  } else {
    // In previous month's cycle
    const lastMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
    return (lastMonth.getDate() - birthDay) + referenceDay;
  }
};

// Convert grid array to 3x3 layout (center empty)
const gridToLayout = (sequence: number[]): (number | null)[][] => {
  // Clockwise from top-left: [0,1,2,3,center(empty),4,5,6,7]
  // Positions: TL, T, TR, R, center, MR, BR, B, BL
  return [
    [sequence[0], sequence[1], sequence[2]], // Top row
    [sequence[7], null, sequence[3]],        // Middle row (center empty)
    [sequence[6], sequence[5], sequence[4]]  // Bottom row
  ];
};

// TaksaGrid component
const TaksaGrid = ({ grid, title }: { grid: number[], title: string }) => {
  const layout = gridToLayout(grid);
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-3 gap-1 w-36 h-36 border-2 border-primary rounded">
        {layout.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`flex items-center justify-center border border-border ${
                cell === null ? 'bg-muted' : 'bg-background'
              }`}
            >
              {cell !== null && (
                <span className="text-lg font-semibold text-foreground">{cell}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface LifestyleHistoryEntry {
  id: string;
  patient_id: string;
  lifestyle_data: LifestyleData;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
  changed_by_name?: string;
}

export function TTMPatientProfileTab({ patientId }: TTMPatientProfileTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("demographics");
  const [selectedTaksaDate, setSelectedTaksaDate] = useState<Date>(new Date());
  const [lifestyleData, setLifestyleData] = useState<LifestyleData | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient-ttm", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    full_name: "",
    gender: "",
    date_of_birth: "",
    birth_time: "",
    height: "",
    weight: "",
    occupation: "",
    id_number: "",
    present_illness: "",
    family_history: "",
    current_medications: "",
    past_operations: "",
    practitioner_notes: "",
  });

  // Load patient data when available
  useEffect(() => {
    if (patient) {
      setFormData({
        full_name: patient.full_name || "",
        gender: patient.gender || "",
        date_of_birth: patient.date_of_birth || "",
        birth_time: patient.birth_time || "",
        height: patient.height?.toString() || "",
        weight: patient.weight?.toString() || "",
        occupation: patient.occupation || "",
        id_number: (patient as any).id_number || "",
        present_illness: patient.present_illness || "",
        family_history: patient.family_history || "",
        current_medications: patient.current_medications || "",
        past_operations: patient.past_operations || "",
        practitioner_notes: patient.practitioner_notes || "",
      });

      // Load lifestyle data
      if (patient.lifestyle_recommendations) {
        try {
          const parsed = JSON.parse(patient.lifestyle_recommendations) as LifestyleData;
          setLifestyleData(parsed);
        } catch (error) {
          logger.error('Error parsing lifestyle recommendations:', error);
          setLifestyleData(null);
        }
      } else {
        setLifestyleData(null);
      }
    }
  }, [patient]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("patients")
        .update({
          gender: formData.gender || null,
          birth_time: formData.birth_time || null,
          height: formData.height ? parseFloat(formData.height) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          occupation: formData.occupation || null,
          id_number: formData.id_number || null,
          present_illness: formData.present_illness || null,
          family_history: formData.family_history || null,
          current_medications: formData.current_medications || null,
          past_operations: formData.past_operations || null,
          practitioner_notes: formData.practitioner_notes || null,
        })
        .eq("id", patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-ttm", patientId] });
      toast.success("Student profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update student profile");
    },
  });

  // Fetch lifestyle history
  const { data: lifestyleHistory } = useQuery({
    queryKey: ["lifestyle-history", patientId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lifestyle_assessment_history")
        .select(`
          *,
          changed_by_profile:profiles!lifestyle_assessment_history_changed_by_fkey(full_name)
        `)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((entry: any) => ({
        ...entry,
        lifestyle_data: entry.lifestyle_data as LifestyleData,
        changed_by_name: entry.changed_by_profile?.full_name || null,
      })) as LifestyleHistoryEntry[];
    },
    enabled: !!patientId,
  });

  const updateLifestyleMutation = useMutation({
    mutationFn: async (data: LifestyleData) => {
      // Save current version to history before updating (if it exists)
      if (patient?.lifestyle_recommendations) {
        try {
          const currentData = JSON.parse(patient.lifestyle_recommendations);
          // Only save to history if data has actually changed
          if (JSON.stringify(currentData) !== JSON.stringify(data)) {
            await (supabase as any)
              .from("lifestyle_assessment_history")
              .insert({
                patient_id: patientId,
                lifestyle_data: currentData,
                changed_by: user?.id || null,
                change_reason: "Updated lifestyle assessment",
              });
          }
        } catch (historyError) {
          logger.error("Error saving to history:", historyError);
          // Don't fail the update if history save fails
        }
      }

      // Update current lifestyle data
      const { error } = await supabase
        .from("patients")
        .update({
          lifestyle_recommendations: JSON.stringify(data),
        })
        .eq("id", patientId);

      if (error) throw error;

      // If this is the first time saving (no previous data), save to history after update
      if (!patient?.lifestyle_recommendations) {
        try {
          await (supabase as any)
            .from("lifestyle_assessment_history")
            .insert({
              patient_id: patientId,
              lifestyle_data: data,
              changed_by: user?.id || null,
              change_reason: "Initial lifestyle assessment",
            });
        } catch (historyError) {
          logger.error("Error saving initial history:", historyError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-ttm", patientId] });
      queryClient.invalidateQueries({ queryKey: ["lifestyle-history", patientId] });
      toast.success("Lifestyle assessment updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update lifestyle assessment");
    },
  });

  const restoreHistoryMutation = useMutation({
    mutationFn: async (historyEntry: LifestyleHistoryEntry) => {
      // Save current version to history before restoring
      if (patient?.lifestyle_recommendations) {
        try {
          await (supabase as any)
            .from("lifestyle_assessment_history")
            .insert({
              patient_id: patientId,
              lifestyle_data: JSON.parse(patient.lifestyle_recommendations),
              changed_by: user?.id || null,
              change_reason: "Restored from history",
            });
        } catch (historyError) {
          logger.error("Error saving to history:", historyError);
        }
      }

      // Restore the historical version
      const { error } = await supabase
        .from("patients")
        .update({
          lifestyle_recommendations: JSON.stringify(historyEntry.lifestyle_data),
        })
        .eq("id", patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-ttm", patientId] });
      queryClient.invalidateQueries({ queryKey: ["lifestyle-history", patientId] });
      setHistoryDialogOpen(false);
      toast.success("Lifestyle assessment restored successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to restore lifestyle assessment");
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const age = calculateAge(formData.date_of_birth);
  const dayOfWeekBorn = calculateDayOfWeekBorn(formData.date_of_birth, formData.birth_time);
  const thaiLunarDay = calculateThaiLunarDay(formData.date_of_birth);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Student Base Information</h3>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="taksa">Taksa</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="demographics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Age</Label>
                <div className="p-2 bg-muted rounded">{age !== null ? `${age} years` : "—"}</div>
              </div>

              <div className="space-y-2">
                <Label>Birth Date</Label>
                <div className="p-2 bg-muted rounded">
                  {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : "—"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Birth Time</Label>
                <Input
                  type="time"
                  value={formData.birth_time}
                  onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Day of Week Born</Label>
                <div className="p-2 bg-muted rounded">{dayOfWeekBorn || "—"}</div>
              </div>

              <div className="space-y-2">
                <Label>Thai Lunar Calendar Day</Label>
                <div className="p-2 bg-muted rounded">{thaiLunarDay || "—"}</div>
              </div>

              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="e.g., 170.5"
                />
              </div>

              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g., 65.5"
                />
              </div>

              <div className="space-y-2">
                <Label>Career</Label>
                <Input
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="Student's occupation or career"
                />
              </div>

              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  placeholder="Student identification number"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4">
            <div className="space-y-2">
              <Label>Chronic or Current Illness</Label>
              <Textarea
                value={formData.present_illness}
                onChange={(e) => setFormData({ ...formData, present_illness: e.target.value })}
                rows={4}
                placeholder="Current chronic conditions, ongoing illnesses, or active health concerns"
              />
            </div>

            <div className="space-y-2">
              <Label>Family History</Label>
              <Textarea
                value={formData.family_history}
                onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                rows={4}
                placeholder="Any family medical history, hereditary conditions, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Current Medications</Label>
              <Textarea
                value={formData.current_medications}
                onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                rows={3}
                placeholder="List of current medications, supplements, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Operations / Accidents</Label>
              <Textarea
                value={formData.past_operations}
                onChange={(e) => setFormData({ ...formData, past_operations: e.target.value })}
                rows={4}
                placeholder="Previous surgeries, operations, or accidents"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.practitioner_notes}
                onChange={(e) => setFormData({ ...formData, practitioner_notes: e.target.value })}
                rows={4}
                placeholder="Additional medical notes, observations, or other relevant information"
              />
            </div>
          </TabsContent>

          <TabsContent value="lifestyle" className="space-y-4">
            {lifestyleData !== null ? (
              <>
                <LifestyleAssessment
                  value={lifestyleData}
                  onChange={(data) => setLifestyleData(data)}
                  disabled={false}
                />
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setHistoryDialogOpen(true)}
                      disabled={!lifestyleHistory || lifestyleHistory.length === 0}
                    >
                      <History className="h-4 w-4 mr-2" />
                      View History ({lifestyleHistory?.length || 0})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!lifestyleData || !patient) return;
                        
                        // Create export data
                        const exportData = {
                          patient_name: patient.full_name,
                          patient_id: patient.id,
                          export_date: new Date().toISOString(),
                          lifestyle_assessment: lifestyleData,
                        };
                        
                        // Create JSON blob
                        const jsonString = JSON.stringify(exportData, null, 2);
                        const blob = new Blob([jsonString], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${patient.full_name.replace(/\s+/g, '_')}_Lifestyle_Assessment_${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        
                        toast.success('Lifestyle assessment exported successfully');
                      }}
                      disabled={!lifestyleData}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                  <Button
                    onClick={() => {
                      if (lifestyleData) {
                        updateLifestyleMutation.mutate(lifestyleData);
                      }
                    }}
                    disabled={updateLifestyleMutation.isPending}
                  >
                    {updateLifestyleMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Lifestyle Assessment
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p>No lifestyle assessment data available.</p>
                  <p className="text-sm mt-2">Start by adding lifestyle information below.</p>
                </div>
                <LifestyleAssessment
                  value={undefined}
                  onChange={(data) => setLifestyleData(data)}
                  disabled={false}
                />
                {lifestyleData && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() => {
                        updateLifestyleMutation.mutate(lifestyleData);
                      }}
                      disabled={updateLifestyleMutation.isPending}
                    >
                      {updateLifestyleMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Lifestyle Assessment
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="taksa" className="space-y-6">
            {formData.date_of_birth ? (
              <>
                {/* Date Selector */}
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2">Calculate Taksa for Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedTaksaDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedTaksaDate}
                          onSelect={(date) => date && setSelectedTaksaDate(date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedTaksaDate(new Date())}
                    className="mt-6"
                  >
                    Today
                  </Button>
                </div>

                {/* Astrology Grids */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Astrology Chart</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <TaksaGrid
                      grid={getBaseGrid(getDayOfWeekIndex(formData.date_of_birth, formData.birth_time))}
                      title="Birth Day"
                    />
                    <TaksaGrid
                      grid={rotateSequence(
                        getBaseGrid(getDayOfWeekIndex(formData.date_of_birth, formData.birth_time)),
                        calculateCurrentAge(formData.date_of_birth, selectedTaksaDate)
                      )}
                      title="Year (Age)"
                    />
                    <TaksaGrid
                      grid={rotateSequence(
                        rotateSequence(
                          getBaseGrid(getDayOfWeekIndex(formData.date_of_birth, formData.birth_time)),
                          calculateCurrentAge(formData.date_of_birth, selectedTaksaDate)
                        ),
                        calculateMonthsSinceBirthday(formData.date_of_birth, selectedTaksaDate)
                      )}
                      title="Month"
                    />
                    <TaksaGrid
                      grid={rotateSequence(
                        rotateSequence(
                          rotateSequence(
                            getBaseGrid(getDayOfWeekIndex(formData.date_of_birth, formData.birth_time)),
                            calculateCurrentAge(formData.date_of_birth, selectedTaksaDate)
                          ),
                          calculateMonthsSinceBirthday(formData.date_of_birth, selectedTaksaDate)
                        ),
                        calculateDaysSinceBirthDay(formData.date_of_birth, selectedTaksaDate)
                      )}
                      title="Day"
                    />
                  </div>
                </div>

                {/* Name and Numerology */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm text-muted-foreground">Full Name</Label>
                      <p className="text-lg font-medium">{formData.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Pythagorean Numerology</Label>
                      <p className="text-2xl font-mono font-bold tracking-wider text-primary">
                        {convertToNumerology(formData.full_name)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">ID Number</Label>
                    <p className="text-lg font-medium">{formData.id_number || '—'}</p>
                  </div>
                </div>

                {/* Calculation Details */}
                <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded">
                  <p className="font-medium">Calculating for: {format(selectedTaksaDate, "PPP")}</p>
                  <p>Age at this date: {calculateCurrentAge(formData.date_of_birth, selectedTaksaDate)} years</p>
                  <p>Months since last birthday: {calculateMonthsSinceBirthday(formData.date_of_birth, selectedTaksaDate)}</p>
                  <p>Days since birth day this month: {calculateDaysSinceBirthDay(formData.date_of_birth, selectedTaksaDate)}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Birth date is required to calculate Taksa chart</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          size="lg"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Lifestyle History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Lifestyle Assessment History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of the lifestyle assessment
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {!lifestyleHistory || lifestyleHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No history available yet.</p>
                <p className="text-sm mt-2">History will be created when you save changes to the lifestyle assessment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lifestyleHistory.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index === 0 ? "Most Recent" : `Version ${lifestyleHistory.length - index}`}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(entry.created_at), "PPpp")}
                          </span>
                        </div>
                        {entry.changed_by_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Changed by: {entry.changed_by_name}
                          </p>
                        )}
                        {entry.change_reason && (
                          <p className="text-xs text-muted-foreground">
                            Reason: {entry.change_reason}
                          </p>
                        )}
                      </div>
                      {index > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to restore this version? The current version will be saved to history.")) {
                              restoreHistoryMutation.mutate(entry);
                            }
                          }}
                          disabled={restoreHistoryMutation.isPending}
                        >
                          {restoreHistoryMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            "Restore"
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <LifestyleAssessment
                        value={entry.lifestyle_data}
                        onChange={() => {}}
                        disabled={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
