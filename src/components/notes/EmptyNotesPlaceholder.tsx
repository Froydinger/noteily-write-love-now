
import { Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/contexts/NoteContext';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export default function EmptyNotesPlaceholder() {
  const { addNote, setCurrentNote } = useNotes();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  
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
    <div className="h-full overflow-y-auto">
      <div className="relative">
        {(isMobile || state === "collapsed") && (
          <div className="absolute top-4 left-4 z-10">
            <SidebarTrigger />
          </div>
        )}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Heart className="h-16 w-16 mb-6 text-accent transition-all duration-300 ease-out" />
          <h2 className="text-2xl font-serif font-medium mb-3 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>Welcome to Noteily</h2>
          <p className="text-muted-foreground max-w-md mb-8 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            Create your first note to start your journey of self-expression and reflection.
          </p>
          <Button 
            onClick={handleCreateFirstNote} 
            className="flex items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-lg animate-scale-in group rounded-full"
            style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
          >
            <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Create Your First Note
          </Button>
        </div>
      </div>
    </div>
  );
}
