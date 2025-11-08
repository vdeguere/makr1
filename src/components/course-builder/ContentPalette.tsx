import { Video, BookOpen, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentPaletteProps {
  onAddLesson: (type: 'video' | 'reading' | 'quiz') => void;
}

const contentTypes = [
  { type: 'video' as const, icon: Video, label: 'Video Lesson', color: 'bg-blue-500 hover:bg-blue-600' },
  { type: 'reading' as const, icon: BookOpen, label: 'Reading Material', color: 'bg-green-500 hover:bg-green-600' },
  { type: 'quiz' as const, icon: HelpCircle, label: 'Quiz', color: 'bg-purple-500 hover:bg-purple-600' },
];

export function ContentPalette({ onAddLesson }: ContentPaletteProps) {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/30 border-t">
      <span className="text-sm font-medium text-muted-foreground mr-2">Add Content:</span>
      {contentTypes.map(({ type, icon: Icon, label, color }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          className={`${color} text-white border-none hover:text-white`}
          onClick={() => onAddLesson(type)}
        >
          <Icon className="h-4 w-4 mr-2" />
          {label}
        </Button>
      ))}
    </div>
  );
}
