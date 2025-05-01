
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/contexts/NoteContext';
import { useNavigate } from 'react-router-dom';

export default function EmptyNotesPlaceholder() {
  const { addNote, setCurrentNote } = useNotes();
  const navigate = useNavigate();
  
  const handleCreateFirstNote = () => {
    const newNote = addNote();
    setCurrentNote(newNote);
    navigate(`/note/${newNote.id}`);
  };
  
  return (
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
  );
}

import { Heart } from 'lucide-react';
