
import { Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/contexts/NoteContext';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export default function EmptyNotesPlaceholder() {
  const { addNote, setCurrentNote, loading } = useNotes();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  
  if (loading) {
    return (
      <div className="relative">
        {(isMobile || state === "collapsed") && (
          <div className="absolute top-4 left-4 z-10">
            <SidebarTrigger />
          </div>
        )}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }
  
  const handleCreateFirstNote = async () => {
    try {
      const newNote = await addNote();
      setCurrentNote(newNote);
      navigate(`/note/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };
  
  return (
    <div className="relative">
      {(isMobile || state === "collapsed") && (
        <div className="absolute top-4 left-4 z-10">
          <SidebarTrigger />
        </div>
      )}
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Heart className="h-16 w-16 mb-6 text-noteily-300" />
        <h2 className="text-2xl font-serif font-medium mb-3">Welcome to Noteily</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Create your first note to start your journey of self-expression and reflection.
        </p>
        <Button onClick={handleCreateFirstNote} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Your First Note
        </Button>
      </div>
    </div>
  );
}
