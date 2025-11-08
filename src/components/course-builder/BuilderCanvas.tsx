import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SectionBlock } from './SectionBlock';
import type { Section, Lesson } from '@/lib/courseBuilderUtils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BuilderCanvasProps {
  sections: Section[];
  lessons: Lesson[];
  onAddSection: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddLesson: (sectionId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonId: string | null;
}

export function BuilderCanvas({
  sections,
  lessons,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onSelectLesson,
  selectedLessonId,
}: BuilderCanvasProps) {
  const sortedSections = [...sections].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div>
          <h2 className="text-lg font-semibold">Course Structure</h2>
          <p className="text-sm text-muted-foreground">Drag to reorder sections and lessons</p>
        </div>
        <Button onClick={onAddSection} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* Sections List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {sortedSections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm mb-4">No sections yet</p>
              <Button onClick={onAddSection} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Section
              </Button>
            </div>
          ) : (
            <SortableContext items={sortedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sortedSections.map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  lessons={lessons}
                  onEditSection={onEditSection}
                  onDeleteSection={onDeleteSection}
                  onAddLesson={onAddLesson}
                  onEditLesson={onEditLesson}
                  onDeleteLesson={onDeleteLesson}
                  onSelectLesson={onSelectLesson}
                  selectedLessonId={selectedLessonId}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
