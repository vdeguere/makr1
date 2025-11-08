import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Circle, Droplet, Flame, Zap, Heart, AlertCircle, Activity, 
         Thermometer, Wind, Eye, Ear, Hand, Footprints, Brain, Bone,
         CheckCircle, XCircle, Plus, Minus, Star, Sparkles, CircleDot,
         Crosshair, Target, Dot, Hexagon, Triangle, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export const iconMap = {
  Circle, Droplet, Flame, Zap, Heart, AlertCircle, Activity,
  Thermometer, Wind, Eye, Ear, Hand, Footprints, Brain, Bone,
  CheckCircle, XCircle, Plus, Minus, Star, Sparkles, CircleDot,
  Crosshair, Target, Dot, Hexagon, Triangle, Square
};

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const SelectedIcon = iconMap[value as keyof typeof iconMap] || Circle;
  
  const filteredIcons = Object.keys(iconMap).filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <SelectedIcon className="mr-2 h-4 w-4" />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />
        <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
          {filteredIcons.map((iconName) => {
            const Icon = iconMap[iconName as keyof typeof iconMap];
            return (
              <Button
                key={iconName}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 w-10",
                  value === iconName && "bg-accent"
                )}
                onClick={() => onChange(iconName)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
