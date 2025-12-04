import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface LifestyleData {
  dietaryTriggers: {
    dairy: boolean;
    gluten: boolean;
    sugar: boolean;
    other?: string;
  };
  hormonalHistory: {
    cycleTracking: boolean;
    cycleNotes?: string;
  };
  stressLevel: number; // 1-10 scale
  currentProducts: string;
}

interface LifestyleAssessmentProps {
  value?: LifestyleData;
  onChange: (data: LifestyleData) => void;
  disabled?: boolean;
}

export function LifestyleAssessment({ value, onChange, disabled }: LifestyleAssessmentProps) {
  const [data, setData] = useState<LifestyleData>(value || {
    dietaryTriggers: {
      dairy: false,
      gluten: false,
      sugar: false,
      other: '',
    },
    hormonalHistory: {
      cycleTracking: false,
      cycleNotes: '',
    },
    stressLevel: 5,
    currentProducts: '',
  });

  useEffect(() => {
    if (value) {
      setData(value);
    }
  }, [value]);

  const updateData = (updates: Partial<LifestyleData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dietary Triggers</CardTitle>
          <CardDescription>Identify potential dietary triggers for skin concerns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dairy"
              checked={data.dietaryTriggers.dairy}
              onCheckedChange={(checked) => {
                updateData({
                  dietaryTriggers: {
                    ...data.dietaryTriggers,
                    dairy: checked === true,
                  },
                });
              }}
              disabled={disabled}
            />
            <Label htmlFor="dairy" className="font-normal cursor-pointer">
              Dairy consumption
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="gluten"
              checked={data.dietaryTriggers.gluten}
              onCheckedChange={(checked) => {
                updateData({
                  dietaryTriggers: {
                    ...data.dietaryTriggers,
                    gluten: checked === true,
                  },
                });
              }}
              disabled={disabled}
            />
            <Label htmlFor="gluten" className="font-normal cursor-pointer">
              Gluten consumption
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sugar"
              checked={data.dietaryTriggers.sugar}
              onCheckedChange={(checked) => {
                updateData({
                  dietaryTriggers: {
                    ...data.dietaryTriggers,
                    sugar: checked === true,
                  },
                });
              }}
              disabled={disabled}
            />
            <Label htmlFor="sugar" className="font-normal cursor-pointer">
              High sugar intake
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietary-other">Other Dietary Notes</Label>
            <Textarea
              id="dietary-other"
              value={data.dietaryTriggers.other || ''}
              onChange={(e) => {
                updateData({
                  dietaryTriggers: {
                    ...data.dietaryTriggers,
                    other: e.target.value,
                  },
                });
              }}
              placeholder="Any other dietary triggers or notes..."
              rows={2}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hormonal History</CardTitle>
          <CardDescription>Track hormonal factors that may affect skin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cycle-tracking"
              checked={data.hormonalHistory.cycleTracking}
              onCheckedChange={(checked) => {
                updateData({
                  hormonalHistory: {
                    ...data.hormonalHistory,
                    cycleTracking: checked === true,
                  },
                });
              }}
              disabled={disabled}
            />
            <Label htmlFor="cycle-tracking" className="font-normal cursor-pointer">
              Track menstrual cycle
            </Label>
          </div>

          {data.hormonalHistory.cycleTracking && (
            <div className="space-y-2">
              <Label htmlFor="cycle-notes">Cycle Notes</Label>
              <Textarea
                id="cycle-notes"
                value={data.hormonalHistory.cycleNotes || ''}
                onChange={(e) => {
                  updateData({
                    hormonalHistory: {
                      ...data.hormonalHistory,
                      cycleNotes: e.target.value,
                    },
                  });
                }}
                placeholder="Notes about cycle timing, irregularities, etc."
                rows={3}
                disabled={disabled}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stress Levels</CardTitle>
          <CardDescription>Rate your current stress level (1-10 scale)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="stress-level">Stress Level: {data.stressLevel}/10</Label>
              <span className="text-sm text-muted-foreground">
                {data.stressLevel <= 3 ? 'Low' : data.stressLevel <= 6 ? 'Moderate' : 'High'}
              </span>
            </div>
            <Slider
              id="stress-level"
              min={1}
              max={10}
              step={1}
              value={[data.stressLevel]}
              onValueChange={(value) => {
                updateData({ stressLevel: value[0] });
              }}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Products</CardTitle>
          <CardDescription>List products currently being used</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="current-products">Current Skincare Products</Label>
            <Textarea
              id="current-products"
              value={data.currentProducts}
              onChange={(e) => {
                updateData({ currentProducts: e.target.value });
              }}
              placeholder="List all current skincare products, medications, or supplements..."
              rows={4}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

