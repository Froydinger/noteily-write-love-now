import { useState, useMemo } from 'react';
import { useNotes } from '@/contexts/NoteContext';
import NoteCard from '@/components/notes/NoteCard';
import EmptyNotesPlaceholder from '@/components/notes/EmptyNotesPlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import PullToRefresh from 'react-simple-pull-to-refresh';

const Index = () => {
  const { notes, addNote, setCurrentNote, loading, syncNotes } = useNotes();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    switch (sortOrder) {
      case 'alphabetical':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'latest':
      default:
        return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  }, [notes, searchTerm, sortOrder]);
  
  const handleCreateNote = async () => {
    try {
      const newNote = await addNote();
      setCurrentNote(newNote);
      navigate(`/note/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleRefresh = async () => {
    await syncNotes();
  };

  if (loading || notes.length === 0) {
    return <EmptyNotesPlaceholder />;
  }

  const content = (
    <div className="p-6 md:p-10 animate-fade-in"
         style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {(isMobile || state === "collapsed") && <SidebarTrigger />}
          <h1 className="text-2xl font-serif font-medium">All Notes</h1>
        </div>
        
        <Button 
          onClick={handleCreateNote} 
          className="flex items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-md rounded-full"
        >
          <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          New Note
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search notes by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex-shrink-0">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {searchTerm && (
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedNotes.length} of {notes.length} notes shown
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
        {filteredAndSortedNotes.map((note, index) => (
          <div 
            key={note.id}
            className="animate-float-in"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            <NoteCard note={note} />
          </div>
        ))}
      </div>
    </div>
  );

  return isMobile ? (
    <PullToRefresh onRefresh={handleRefresh} pullingContent="">
      {content}
    </PullToRefresh>
  ) : content;
};

export default Index;
