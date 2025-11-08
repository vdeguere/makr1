import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeftRight, Check } from 'lucide-react';
import { ComparisonPeriod, getComparisonPresets } from '@/lib/comparisonUtils';
import { cn } from '@/lib/utils';

interface ComparisonSelectorProps {
  value: ComparisonPeriod;
  onChange: (value: ComparisonPeriod) => void;
  disabled?: boolean;
}

export function ComparisonSelector({ value, onChange, disabled }: ComparisonSelectorProps) {
  const presets = getComparisonPresets();
  const selectedPreset = presets.find(p => p.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            'min-w-[160px] justify-between',
            value !== 'none' && 'border-primary'
          )}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {selectedPreset?.label || 'Compare'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Compare Periods</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {presets.map((preset) => (
          <DropdownMenuItem
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className="cursor-pointer"
          >
            <Check 
              className={cn(
                'mr-2 h-4 w-4',
                value === preset.value ? 'opacity-100' : 'opacity-0'
              )} 
            />
            {preset.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
