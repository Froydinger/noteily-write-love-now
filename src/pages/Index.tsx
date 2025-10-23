import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes } from '@/contexts/NoteContext';
import { Note } from '@/contexts/NoteContext';
import NoteCard from '@/components/notes/NoteCard';
import EmptyNotesPlaceholder from '@/components/notes/EmptyNotesPlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, ArrowUpDown, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/hooks/useNotifications';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { ShareManager } from '@/components/notes/ShareManager';
import { toast } from '@/components/ui/sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Index = () => {
  const { user } = useAuth();
  const { notes, addNote, setCurrentNote, loading, syncNotes, hasInitialLoad, deleteNote, togglePinNote } = useNotes();
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
  const [showSearch, setShowSearch] = useState(false);
  const [openSelect, setOpenSelect] = useState<string | null>(null);

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

    const pinned = sorted.filter(n => n.pinned);
    const unpinned = sorted.filter(n => !n.pinned);
    return [...pinned, ...unpinned];
  }, [notes, searchTerm, sortOrder, shareFilter]);
  
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
    // Simply select the note - opening will be handled by NoteCard's onOpen
    setSelectedNoteId(note.id);
  };

  const handleDeleteNote = async (note: Note) => {
    try {
      await deleteNote(note.id);
      setSelectedNoteId(null);
      toast.success('Note deleted');
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    }
  };

  // Debug logging to track the race condition
  console.log('Index render state:', { loading, notesLength: notes.length, hasUser: !!user, hasInitialLoad });

  // Simplified rendering logic - always show content when user exists
  if (!user) {
    return null; // This shouldn't happen since we're inside authenticated route
  }

  // Show empty state when we've completed the initial load AND notes are actually empty
  if (hasInitialLoad && !loading && notes.length === 0) {
    console.log('Showing EmptyNotesPlaceholder - hasInitialLoad:', hasInitialLoad);
    return <EmptyNotesPlaceholder />;
  }

  const content = (
    <div className="min-h-full apple-pwa-content">
      <div className="p-3 md:p-6 animate-fade-in apple-pwa-content"
           style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
           onClick={() => setSelectedNoteId(null)}>
        {/* Mobile layout: My Notes text on far right, buttons underneath */}
        <div className="md:hidden mb-6">
          {/* Top row: Menu button left, My Notes text far right */}
          <div className="flex items-center justify-between mb-4 apple-pwa-header-spacing">
            <div className="flex items-center">
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
            </div>
            <h1 className="text-2xl font-light dynamic-title-font">My Notes</h1>
          </div>

          {/* Bottom row: All buttons */}
          <div className="flex items-center gap-2 mt-6 px-2 py-2">
            <Button 
              onClick={handleCreateNote} 
              className="flex items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-md rounded-full whitespace-nowrap apple-pwa-button-spacing"
            >
              <Plus className="h-4 w-4" />
              New Note
            </Button>

            <Button
              size="sm"
              className="h-10 px-3 rounded-full hover:scale-105 active:scale-95 transition-all duration-150"
              onClick={() => {
                setOpenSelect(null);
                setShowSearch(true);
                setTimeout(() => {
                  const input = document.getElementById('search-input') as HTMLInputElement;
                  input?.focus();
                  input?.click();
                }, 150);
              }}
            >
              <Search className="h-4 w-4" />
            </Button>

            <Select 
              value={sortOrder} 
              onValueChange={(value) => {
                setSortOrder(value);
                setOpenSelect(null);
              }}
              open={openSelect === 'sort-mobile'}
              onOpenChange={(open) => {
                if (!open) setOpenSelect(null);
              }}
            >
              <SelectTrigger 
                className="h-10 px-3 rounded-full bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-150 data-[state=open]:bg-primary/90 [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden [&>[data-radix-select-icon]]:hidden"
                onClick={() => {
                  setShowSearch(false);
                  setOpenSelect(openSelect === 'sort-mobile' ? null : 'sort-mobile');
                }}
              >
                <ArrowUpDown className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover border shadow-lg" side="bottom" align="center" sideOffset={5}>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={shareFilter} 
              onValueChange={(value) => {
                setShareFilter(value);
                setOpenSelect(null);
              }}
              open={openSelect === 'filter-mobile'}
              onOpenChange={(open) => {
                if (!open) setOpenSelect(null);
              }}
            >
              <SelectTrigger 
                className="h-10 px-3 rounded-full bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-150 data-[state=open]:bg-primary/90 [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden [&>[data-radix-select-icon]]:hidden"
                onClick={() => {
                  setShowSearch(false);
                  setOpenSelect(openSelect === 'filter-mobile' ? null : 'filter-mobile');
                }}
              >
                <Filter className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover border shadow-lg" side="bottom" align="center" sideOffset={5}>
                <SelectItem value="all">All Notes</SelectItem>
                <SelectItem value="shared-with-me">Shared with Me</SelectItem>
                <SelectItem value="shared-with-others">My Shared Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop layout: Menu button, buttons with space, My Notes text far right */}
        <div className="hidden md:flex items-center justify-between mb-6 apple-pwa-header-spacing">
          {/* Left side: Menu button + buttons */}
          <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-2 px-2 py-2">
              <Button 
                onClick={handleCreateNote} 
                className="flex items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-md rounded-full apple-pwa-button-spacing"
              >
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                New Note
              </Button>

              <Button
                size="sm"
                className="h-10 px-3 rounded-full hover:scale-105 active:scale-95 transition-all duration-150"
                onClick={() => {
                  setOpenSelect(null);
                  setShowSearch(true);
                  setTimeout(() => {
                    const input = document.getElementById('search-input') as HTMLInputElement;
                    input?.focus();
                    input?.click();
                  }, 150);
                }}
              >
                <Search className="h-4 w-4" />
              </Button>

              <Select 
                value={sortOrder} 
                onValueChange={(value) => {
                  setSortOrder(value);
                  setOpenSelect(null);
                }}
                open={openSelect === 'sort-desktop'}
                onOpenChange={(open) => {
                  if (!open) setOpenSelect(null);
                }}
              >
                <SelectTrigger 
                  className="h-10 px-3 rounded-full bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-150 data-[state=open]:bg-primary/90 [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden [&>[data-radix-select-icon]]:hidden"
                  onClick={() => {
                    setShowSearch(false);
                    setOpenSelect(openSelect === 'sort-desktop' ? null : 'sort-desktop');
                  }}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover border shadow-lg" side="bottom" align="center" sideOffset={5}>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={shareFilter} 
                onValueChange={(value) => {
                  setShareFilter(value);
                  setOpenSelect(null);
                }}
                open={openSelect === 'filter-desktop'}
                onOpenChange={(open) => {
                  if (!open) setOpenSelect(null);
                }}
              >
                <SelectTrigger 
                  className="h-10 px-3 rounded-full bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-150 data-[state=open]:bg-primary/90 [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden [&>[data-radix-select-icon]]:hidden"
                  onClick={() => {
                    setShowSearch(false);
                    setOpenSelect(openSelect === 'filter-desktop' ? null : 'filter-desktop');
                  }}
                >
                  <Filter className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover border shadow-lg" side="bottom" align="center" sideOffset={5}>
                  <SelectItem value="all">All Notes</SelectItem>
                  <SelectItem value="shared-with-me">Shared with Me</SelectItem>
                  <SelectItem value="shared-with-others">My Shared Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right side: My Notes text */}
          <h1 className="text-2xl font-light dynamic-title-font">My Notes</h1>
        </div>

        {/* Search Input - appears when search bubble is clicked */}
        {showSearch && (
          <div className="relative mb-4 animate-in slide-in-from-top-2 duration-200">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search-input"
              placeholder="Search notes by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => {
                if (!searchTerm) {
                  setShowSearch(false);
                }
              }}
              className="pl-10"
            />
          </div>
        )}
        
        {searchTerm && (
          <div className="text-sm text-muted-foreground mb-4">
            {filteredAndSortedNotes.length} of {notes.length} notes shown
          </div>
        )}
        
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
              <NoteCard note={note} onShareClick={handleShareClick} isSelected={selectedNoteId === note.id} onPress={handleCardPress} onOpen={(n) => navigate(`/note/${n.id}`)} isPinned={note.pinned} onTogglePin={(n) => togglePinNote(n.id)} onDelete={handleDeleteNote} />
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
