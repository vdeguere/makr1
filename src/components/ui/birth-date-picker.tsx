import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BirthDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  label?: string;
  required?: boolean;
}

export function BirthDatePicker({ value, onChange, label = 'Date of Birth', required = false }: BirthDatePickerProps) {
  const [day, setDay] = useState<string>(value ? value.getDate().toString() : '');
  const [month, setMonth] = useState<string>(value ? (value.getMonth() + 1).toString() : '');
  const [year, setYear] = useState<string>(value ? value.getFullYear().toString() : '');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => (currentYear - i).toString());
  
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Calculate days in month
  const getDaysInMonth = (monthNum: number, yearNum: number) => {
    return new Date(yearNum, monthNum, 0).getDate();
  };

  const days = month && year
    ? Array.from({ length: getDaysInMonth(parseInt(month), parseInt(year)) }, (_, i) => (i + 1).toString())
    : Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  // Update the date whenever day, month, or year changes
  useEffect(() => {
    if (day && month && year) {
      const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      onChange(selectedDate);
    } else {
      onChange(undefined);
    }
  }, [day, month, year, onChange]);

  // Adjust day if it's invalid for the selected month/year
  useEffect(() => {
    if (day && month && year) {
      const maxDays = getDaysInMonth(parseInt(month), parseInt(year));
      if (parseInt(day) > maxDays) {
        setDay(maxDays.toString());
      }
    }
  }, [month, year, day]);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="grid grid-cols-3 gap-2">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={day} onValueChange={setDay}>
          <SelectTrigger>
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {days.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
