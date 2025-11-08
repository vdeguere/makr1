import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { BuilderCanvas } from '@/components/course-builder/BuilderCanvas';
import { PropertiesPanel } from '@/components/course-builder/PropertiesPanel';
import { ContentPalette } from '@/components/course-builder/ContentPalette';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  fetchCourseStructure,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  updateSectionOrder,
  updateLessonOrder,
  type Section,
  type Lesson,
  type CourseStructure,
} from '@/lib/courseBuilderUtils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export default function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);

  const [structure, setStructure] = useState<CourseStructure>({ sections: [], lessons: [] });
  const [selectedItem, setSelectedItem] = useState<Lesson | Section | null>(null);
  const [selectedType, setSelectedType] = useState<'lesson' | 'section' | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'lesson' | 'section' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const isAdmin = role === 'admin' || role === 'dev';
    if (!isAdmin) {
      navigate('/');
      toast.error('Access denied');
      return;
    }

    if (courseId) {
      loadCourseStructure();
    }
  }, [courseId, role, navigate]);

  const loadCourseStructure = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      const data = await fetchCourseStructure(courseId);
      setStructure(data);
    } catch (error) {
      console.error('Error loading course structure:', error);
      toast.error('Failed to load course structure');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!courseId) return;

    try {
      const newSection = await createSection({
        course_id: courseId,
        title: 'New Section',
        description: '',
        display_order: structure.sections.length,
        is_published: true,
      });

      setStructure((prev) => ({
        ...prev,
        sections: [...prev.sections, newSection],
      }));

      setSelectedItem(newSection);
      setSelectedType('section');
      toast.success('Section created');
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section');
    }
  };

  const handleEditSection = (section: Section) => {
    setSelectedItem(section);
    setSelectedType('section');
  };

  const handleDeleteSection = (sectionId: string) => {
    setItemToDelete({ id: sectionId, type: 'section' });
    setDeleteDialogOpen(true);
  };

  const handleAddLesson = async (sectionId: string, type: 'video' | 'reading' | 'quiz' = 'video') => {
    if (!courseId) return;

    try {
      const sectionLessons = structure.lessons.filter((l) => l.section_id === sectionId);
      
      const newLesson = await createLesson({
        course_id: courseId,
        section_id: sectionId,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Lesson`,
        description: '',
        lesson_type: type,
        display_order: sectionLessons.length,
        is_published: false,
      });

      setStructure((prev) => ({
        ...prev,
        lessons: [...prev.lessons, newLesson],
      }));

      setSelectedItem(newLesson);
      setSelectedType('lesson');
      toast.success('Lesson created');
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson');
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedItem(lesson);
    setSelectedType('lesson');
  };

  const handleDeleteLesson = (lessonId: string) => {
    setItemToDelete({ id: lessonId, type: 'lesson' });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'section') {
        await deleteSection(itemToDelete.id);
        setStructure((prev) => ({
          ...prev,
          sections: prev.sections.filter((s) => s.id !== itemToDelete.id),
          lessons: prev.lessons.filter((l) => l.section_id !== itemToDelete.id),
        }));
        toast.success('Section deleted');
      } else {
        await deleteLesson(itemToDelete.id);
        setStructure((prev) => ({
          ...prev,
          lessons: prev.lessons.filter((l) => l.id !== itemToDelete.id),
        }));
        toast.success('Lesson deleted');
      }

      if (selectedItem && 'id' in selectedItem && selectedItem.id === itemToDelete.id) {
        setSelectedItem(null);
        setSelectedType(null);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSaveProperties = async (data: any) => {
    if (!selectedItem || !selectedType) return;

    try {
      if (selectedType === 'section') {
        await updateSection((selectedItem as Section).id, data);
        setStructure((prev) => ({
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === (selectedItem as Section).id ? { ...s, ...data } : s
          ),
        }));
        toast.success('Section updated');
      } else {
        await updateLesson((selectedItem as Lesson).id, data);
        setStructure((prev) => ({
          ...prev,
          lessons: prev.lessons.map((l) =>
            l.id === (selectedItem as Lesson).id ? { ...l, ...data } : l
          ),
        }));
        toast.success('Lesson updated');
      }

      setSelectedItem({ ...selectedItem, ...data });
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeItem = structure.sections.find((s) => s.id === active.id) ||
                       structure.lessons.find((l) => l.id === active.id);

    if (!activeItem) return;

    // Handle section reordering
    if ('course_id' in activeItem && !('lesson_type' in activeItem)) {
      const oldIndex = structure.sections.findIndex((s) => s.id === active.id);
      const newIndex = structure.sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== newIndex) {
        const newSections = arrayMove(structure.sections, oldIndex, newIndex);
        setStructure((prev) => ({ ...prev, sections: newSections }));

        // Update display orders
        for (let i = 0; i < newSections.length; i++) {
          await updateSectionOrder(newSections[i].id, i);
        }
      }
    }

    // Handle lesson reordering
    if ('lesson_type' in activeItem) {
      const lesson = activeItem as Lesson;
      const targetSectionId = over.data?.current?.sectionId || lesson.section_id;

      const sectionLessons = structure.lessons
        .filter((l) => l.section_id === targetSectionId)
        .sort((a, b) => a.display_order - b.display_order);

      const oldIndex = sectionLessons.findIndex((l) => l.id === lesson.id);
      const newIndex = over.data?.current?.type === 'section-drop' 
        ? sectionLessons.length 
        : sectionLessons.findIndex((l) => l.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newLessons = arrayMove(sectionLessons, oldIndex, newIndex);
        
        // Update all lessons
        const updatedLessons = structure.lessons.map((l) => {
          if (l.section_id !== targetSectionId) return l;
          const newOrder = newLessons.findIndex((nl) => nl.id === l.id);
          return newOrder !== -1 ? { ...l, display_order: newOrder, section_id: targetSectionId } : l;
        });

        setStructure((prev) => ({ ...prev, lessons: updatedLessons }));

        // Update display orders in database
        for (let i = 0; i < newLessons.length; i++) {
          await updateLessonOrder(newLessons[i].id, i, targetSectionId);
        }
      } else if (lesson.section_id !== targetSectionId) {
        // Move to different section
        await updateLessonOrder(lesson.id, sectionLessons.length, targetSectionId);
        setStructure((prev) => ({
          ...prev,
          lessons: prev.lessons.map((l) =>
            l.id === lesson.id ? { ...l, section_id: targetSectionId, display_order: sectionLessons.length } : l
          ),
        }));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/course-management')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Course Builder</h1>
          <p className="text-sm text-muted-foreground">Visual drag-and-drop editor</p>
        </div>
      </div>

      {/* Main Content */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - Canvas */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <BuilderCanvas
              sections={structure.sections}
              lessons={structure.lessons}
              onAddSection={handleAddSection}
              onEditSection={handleEditSection}
              onDeleteSection={handleDeleteSection}
              onAddLesson={handleAddLesson}
              onEditLesson={handleEditLesson}
              onDeleteLesson={handleDeleteLesson}
              onSelectLesson={handleEditLesson}
              selectedLessonId={selectedType === 'lesson' && selectedItem ? (selectedItem as Lesson).id : null}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Properties */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <PropertiesPanel
              selectedItem={selectedItem}
              itemType={selectedType}
              onSave={handleSaveProperties}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </DndContext>

      {/* Bottom Palette */}
      <ContentPalette
        onAddLesson={(type) => {
          if (structure.sections.length > 0) {
            handleAddLesson(structure.sections[0].id, type);
          } else {
            toast.error('Please create a section first');
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'section'
                ? 'This will delete the section and all its lessons. This action cannot be undone.'
                : 'This will permanently delete this lesson. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
