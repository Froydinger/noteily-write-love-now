import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes } from '@/contexts/NoteContext';
import { Note } from '@/contexts/NoteContext';
import NoteCard from '@/components/notes/NoteCard';
import EmptyNotesPlaceholder from '@/components/notes/EmptyNotesPlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, SortAsc, Users, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/hooks/useNotifications';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { ShareManager } from '@/components/notes/ShareManager';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  const { user } = useAuth();
  const { notes, addNote, setCurrentNote, loading, syncNotes, hasInitialLoad } = useNotes();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');
  const [shareFilter, setShareFilter] = useState('all');
  const [shareManagerNote, setShareManagerNote] = useState<Note | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [shareChanged, setShareChanged] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const key = `pinned:${user?.id || 'guest'}`;
      const raw = localStorage.getItem(key);
      setPinnedIds(raw ? JSON.parse(raw) : []);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    try {
      const key = `pinned:${user?.id || 'guest'}`;
      localStorage.setItem(key, JSON.stringify(pinnedIds.slice(0, 2)));
    } catch {}
  }, [pinnedIds, user?.id]);

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // First apply search filter
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      // Then apply share filter
      switch (shareFilter) {
        case 'shared-with-me':
          return note.isSharedWithUser === true;
        case 'shared-with-others':
          // Only include notes you own that have been explicitly shared with someone
          return note.isOwnedByUser === true && (note.shares?.length ?? 0) > 0;
        case 'all':
        default:
          return true;
      }
    });

    let sorted: Note[] = [];
    switch (sortOrder) {
      case 'alphabetical':
        sorted = filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'oldest':
        sorted = filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'latest':
      default:
        sorted = filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }

    // Place pinned notes first unless using a shared-only view
    if (shareFilter === 'shared-with-me' || shareFilter === 'shared-with-others') {
      return sorted;
    }

    const pinnedSet = new Set(pinnedIds);
    const pinned = sorted.filter(n => pinnedSet.has(n.id));
    const unpinned = sorted.filter(n => !pinnedSet.has(n.id));
    return [...pinned, ...unpinned];
  }, [notes, searchTerm, sortOrder, shareFilter, pinnedIds]);
  
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

  const handleShareClick = (note: Note) => {
    setShareChanged(false);
    setShareManagerNote(note);
  };

  const handleShareClose = () => {
    setShareManagerNote(null);
    if (shareChanged) {
      syncNotes();
    }
    setShareChanged(false);
  };

  const handleShareUpdated = () => {
    setShareChanged(true);
  };

  const handleCardPress = (note: Note) => {
    if (selectedNoteId === note.id) {
      setSelectedNoteId(null);
      navigate(`/note/${note.id}`);
    } else {
      setSelectedNoteId(note.id);
    }
  };

  const handleTogglePin = (note: Note) => {
    setPinnedIds((prev) => {
      if (prev.includes(note.id)) {
        return prev.filter((id) => id !== note.id);
      }
      if (prev.length >= 2) {
        toast.error('You can pin up to 2 notes');
        return prev;
      }
      return [...prev, note.id];
    });
  };

  // Debug logging to track the race condition
  console.log('Index render state:', { loading, notesLength: notes.length, hasUser: !!user, hasInitialLoad });

  // Only show empty state when we've completed the initial load AND notes are actually empty AND we have a user
  if (hasInitialLoad && !loading && notes.length === 0 && user) {
    console.log('Showing EmptyNotesPlaceholder - hasInitialLoad:', hasInitialLoad);
    return <EmptyNotesPlaceholder />;
  }

  // Don't render anything during loading or before initial load to prevent flashing
  if (loading || !hasInitialLoad) {
    console.log('Still loading or no initial load, returning null', { loading, hasInitialLoad });
    return null;
  }

  const content = (
    <div className="min-h-full">
      <div className="p-6 md:p-10 animate-fade-in"
           style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
           onClick={() => setSelectedNoteId(null)}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {(isMobile || state === "collapsed") && (
                <div className="relative">
                  <SidebarTrigger />
                  {user && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
              )}
              <h1 className="text-2xl font-serif font-medium">My Notes</h1>
            </div>
            
            <Button 
              onClick={handleCreateNote} 
              className="flex items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-md rounded-full"
            >
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              New Note
            </Button>
          </div>

          {/* Control Bubbles */}
          <div className="flex items-center gap-2 mb-4">
            {/* Search Bubble */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:scale-105 transition-all duration-200"
                onClick={() => {
                  const searchInput = document.getElementById('search-input');
                  searchInput?.focus();
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Sort Bubble */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="h-8 w-8 p-0 rounded-full border hover:scale-105 transition-all duration-200">
                <SortAsc className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover border shadow-lg">
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Share Filter Bubble */}
            <Select value={shareFilter} onValueChange={setShareFilter}>
              <SelectTrigger className="h-8 w-8 p-0 rounded-full border hover:scale-105 transition-all duration-200">
                {shareFilter === 'shared-with-me' ? <Users className="h-4 w-4" /> : 
                 shareFilter === 'shared-with-others' ? <Share2 className="h-4 w-4" /> : 
                 <Filter className="h-4 w-4" />}
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover border shadow-lg">
                <SelectItem value="all">All Notes</SelectItem>
                <SelectItem value="shared-with-me">Shared with Me</SelectItem>
                <SelectItem value="shared-with-others">My Shared Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hidden Search Input - appears when search bubble is clicked */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search-input"
              placeholder="Search notes by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searchTerm && (
            <div className="text-sm text-muted-foreground mb-4">
              {filteredAndSortedNotes.length} of {notes.length} notes shown
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
          {filteredAndSortedNotes.map((note, index) => (
            <div 
              key={note.id}
              className="animate-float-in"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}
            >
              <NoteCard note={note} onShareClick={handleShareClick} isSelected={selectedNoteId === note.id} onPress={handleCardPress} onOpen={(n) => navigate(`/note/${n.id}`)} isPinned={pinnedIds.includes(note.id)} onTogglePin={handleTogglePin} />
            </div>
          ))}
        </div>
        
        {/* Share Manager */}
        {shareManagerNote && (
          <ShareManager
            isOpen={!!shareManagerNote}
            onClose={handleShareClose}
            note={shareManagerNote}
            onShareUpdate={handleShareUpdated}
          />
        )}
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
