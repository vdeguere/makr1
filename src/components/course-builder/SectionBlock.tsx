import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical, Plus, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LessonItem } from './LessonItem';
import type { Section, Lesson } from '@/lib/courseBuilderUtils';

interface SectionBlockProps {
  section: Section;
  lessons: Lesson[];
  onEditSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddLesson: (sectionId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonId: string | null;
}

export function SectionBlock({
  section,
  lessons,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onSelectLesson,
  selectedLessonId,
}: SectionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { type: 'section' } });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `section-${section.id}`,
    data: { type: 'section-drop', sectionId: section.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sectionLessons = lessons
    .filter((lesson) => lesson.section_id === section.id)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-card overflow-hidden ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 p-3 bg-muted/30 border-b group">
        {/* Drag Handle */}
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* Section Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{section.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {sectionLessons.length} {sectionLessons.length === 1 ? 'lesson' : 'lessons'}
            </Badge>
            {!section.is_published && (
              <Badge variant="outline" className="text-xs">Draft</Badge>
            )}
          </div>
          {section.description && (
            <p className="text-xs text-muted-foreground truncate">{section.description}</p>
          )}
        </div>

        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 opacity-0 group-hover:opacity-100"
          onClick={() => onAddLesson(section.id)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Lesson
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditSection(section)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Section
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDeleteSection(section.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lessons List */}
      {isExpanded && (
        <div ref={setDroppableRef} className="p-3 space-y-2 min-h-[60px]">
          {sectionLessons.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No lessons yet. Drag a lesson here or click "Add Lesson"
            </div>
          ) : (
            <SortableContext items={sectionLessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {sectionLessons.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  onEdit={onEditLesson}
                  onDelete={onDeleteLesson}
                  onSelect={onSelectLesson}
                  isSelected={selectedLessonId === lesson.id}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}
