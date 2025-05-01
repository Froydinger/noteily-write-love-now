
import { useNotes } from '@/contexts/NoteContext';
import NoteCard from '@/components/notes/NoteCard';
import EmptyNotesPlaceholder from '@/components/notes/EmptyNotesPlaceholder';
import { Button } from '@/components/ui/button';
import { Plus, SidebarTrigger } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger as SidebarToggle } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { notes, addNote, setCurrentNote } = useNotes();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleCreateNote = () => {
    const newNote = addNote();
    setCurrentNote(newNote);
    navigate(`/note/${newNote.id}`);
  };

  if (notes.length === 0) {
    return <EmptyNotesPlaceholder />;
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarToggle />}
          <h1 className="text-2xl font-serif font-medium">All Notes</h1>
        </div>
        
        <Button onClick={handleCreateNote} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
};

export default Index;

import { Menu } from 'lucide-react';
