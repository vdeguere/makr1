import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Video, BookOpen, HelpCircle, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDuration } from '@/lib/courseBuilderUtils';
import type { Lesson } from '@/lib/courseBuilderUtils';

interface LessonItemProps {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onSelect: (lesson: Lesson) => void;
  isSelected: boolean;
}

const lessonTypeConfig = {
  video: { icon: Video, color: 'bg-blue-500', label: 'Video' },
  reading: { icon: BookOpen, color: 'bg-green-500', label: 'Reading' },
  quiz: { icon: HelpCircle, color: 'bg-purple-500', label: 'Quiz' },
};

export function LessonItem({ lesson, onEdit, onDelete, onSelect, isSelected }: LessonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = lessonTypeConfig[lesson.lesson_type];
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-3 bg-card border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={() => onSelect(lesson)}
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Lesson Type Icon */}
      <div className={`flex items-center justify-center w-8 h-8 rounded ${config.color} text-white flex-shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{lesson.title}</h4>
          {!lesson.is_published && (
            <Badge variant="outline" className="text-xs">Draft</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{config.label}</span>
          {lesson.video_duration_seconds && (
            <>
              <span>•</span>
              <span>{formatDuration(lesson.video_duration_seconds)}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lesson); }}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Lesson
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(lesson.id); }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
