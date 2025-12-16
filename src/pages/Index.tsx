import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes } from '@/contexts/NoteContext';
import { Note } from '@/contexts/NoteContext';
import NoteCard from '@/components/notes/NoteCard';
import EmptyNotesPlaceholder from '@/components/notes/EmptyNotesPlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, ArrowUpDown, Filter, X, Heart, FileText, CheckSquare, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/hooks/useNotifications';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { ShareManager } from '@/components/notes/ShareManager';
import { toast } from '@/components/ui/sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteType } from "@/types/sharing";

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
  const [showSupportDialog, setShowSupportDialog] = useState(false);

  const filteredAndSortedNotes = useMemo(() => {
    const filtered = notes.filter(note => {
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

  const handleCreateNote = async (noteType: NoteType = 'note') => {
    try {
      const newNote = await addNote(noteType);
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

  const handleDeleteNote = async (note: Note, e?: React.MouseEvent) => {
    // Prevent event bubbling to avoid navigating to the note
    e?.stopPropagation();

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
      <div className="p-4 md:p-8 animate-fade-in apple-pwa-content"
           style={{ animationDelay: '0.05s', animationFillMode: 'both' }}
           onClick={() => setSelectedNoteId(null)}>
        {/* Mobile layout */}
        <div className="md:hidden mb-6">
          {/* Top row: Menu button + Heart on opposite sides, action buttons in middle */}
          <div className="flex items-center justify-between mb-4">
            {(isMobile || state === "collapsed") && (
              <div className="relative">
                <SidebarTrigger className="h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm" />
                {user && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent rounded-full flex items-center justify-center text-[10px] text-accent-foreground font-semibold shadow-glow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowSupportDialog(true)}
              className="p-2 rounded-xl bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-200 shadow-sm"
            >
              <Heart className="h-5 w-5 text-accent" fill="currentColor" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2.5 h-11 px-5 group
                    bg-accent/10 hover:bg-accent/20
                    border-2 border-accent
                    text-accent font-medium
                    rounded-full shadow-glow-sm hover:shadow-glow
                    transition-all duration-250 ease-bounce-out
                    hover:scale-[1.02] active:scale-[0.98]
                    apple-pwa-button-spacing"
                >
                  <Plus className="h-4 w-4 transition-transform duration-250 group-hover:rotate-90" />
                  <span>New</span>
                  <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-[200px] bg-popover border border-border shadow-lg z-50"
              >
                <DropdownMenuItem
                  onClick={() => handleCreateNote('note')}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  <FileText className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Note</span>
                    <span className="text-xs opacity-80">Free-form writing</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCreateNote('checklist')}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  <CheckSquare className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Checklist</span>
                    <span className="text-xs opacity-80">Task list with checkboxes</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              variant="ghost"
              className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm"
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
                className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden"
                onClick={() => {
                  setShowSearch(false);
                  setOpenSelect(openSelect === 'sort-mobile' ? null : 'sort-mobile');
                }}
              >
                <ArrowUpDown className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-elevated" side="bottom" align="center" sideOffset={8}>
                <SelectItem value="latest" className="rounded-lg">Latest</SelectItem>
                <SelectItem value="oldest" className="rounded-lg">Oldest</SelectItem>
                <SelectItem value="alphabetical" className="rounded-lg">A-Z</SelectItem>
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
                className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden"
                onClick={() => {
                  setShowSearch(false);
                  setOpenSelect(openSelect === 'filter-mobile' ? null : 'filter-mobile');
                }}
              >
                <Filter className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-elevated" side="bottom" align="center" sideOffset={8}>
                <SelectItem value="all" className="rounded-lg">All Notes</SelectItem>
                <SelectItem value="shared-with-me" className="rounded-lg">Shared with Me</SelectItem>
                <SelectItem value="shared-with-others" className="rounded-lg">My Shared Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block mb-6">
          {/* Top row: Left buttons + Logo on right */}
          <div className="flex items-center justify-between">
            {/* Left side: Menu + Action buttons */}
            <div className="flex items-center gap-2">
              {state === "collapsed" && (
                <div className="relative mr-1">
                  <SidebarTrigger className="h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm" />
                  {user && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent rounded-full flex items-center justify-center text-[10px] text-accent-foreground font-semibold shadow-glow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
              )}

              {/* Hide New Note button when sidebar is open (desktop only) to avoid duplicate */}
              {state === "collapsed" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center gap-2.5 h-11 px-5 group
                        bg-accent/10 hover:bg-accent/20
                        border-2 border-accent
                        text-accent font-medium
                        rounded-full shadow-glow-sm hover:shadow-glow
                        transition-all duration-250 ease-bounce-out
                        hover:scale-[1.02] active:scale-[0.98]
                        apple-pwa-button-spacing"
                    >
                      <Plus className="h-4 w-4 transition-transform duration-250 group-hover:rotate-90" />
                      <span>New</span>
                      <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[200px] bg-popover border border-border shadow-lg z-50"
                  >
                    <DropdownMenuItem
                      onClick={() => handleCreateNote('note')}
                      className="flex items-center gap-3 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    >
                      <FileText className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Note</span>
                        <span className="text-xs opacity-80">Free-form writing</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateNote('checklist')}
                      className="flex items-center gap-3 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    >
                      <CheckSquare className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Checklist</span>
                        <span className="text-xs opacity-80">Task list with checkboxes</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm"
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
                  className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden"
                  onClick={() => {
                    setShowSearch(false);
                    setOpenSelect(openSelect === 'sort-desktop' ? null : 'sort-desktop');
                  }}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-elevated" side="bottom" align="start" sideOffset={8}>
                  <SelectItem value="latest" className="rounded-lg">Latest</SelectItem>
                  <SelectItem value="oldest" className="rounded-lg">Oldest</SelectItem>
                  <SelectItem value="alphabetical" className="rounded-lg">A-Z</SelectItem>
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
                  className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden"
                  onClick={() => {
                    setShowSearch(false);
                    setOpenSelect(openSelect === 'filter-desktop' ? null : 'filter-desktop');
                  }}
                >
                  <Filter className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-elevated" side="bottom" align="start" sideOffset={8}>
                  <SelectItem value="all" className="rounded-lg">All Notes</SelectItem>
                  <SelectItem value="shared-with-me" className="rounded-lg">Shared with Me</SelectItem>
                  <SelectItem value="shared-with-others" className="rounded-lg">My Shared Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Right side: Logo */}
            <button
              onClick={() => setShowSupportDialog(true)}
              className="p-2 rounded-xl bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-200 shadow-sm"
            >
              <Heart className="h-5 w-5 text-accent" fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Search Input - appears when search bubble is clicked */}
        {showSearch && (
          <div className="relative mb-6 animate-in slide-in-from-top-2 duration-200">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search-input"
              placeholder="Search notes by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-10 h-12 rounded-xl bg-card/80 backdrop-blur-sm border-border/50 focus:border-accent/50 focus:ring-accent/20 transition-all duration-250"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setShowSearch(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {searchTerm && (
          <div className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
              {filteredAndSortedNotes.length}
            </span>
            <span>of {notes.length} notes</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
          {filteredAndSortedNotes.map((note, index) => (
            <div
              key={note.id}
              className="animate-float-in"
              style={{
                animationDelay: `${index * 0.05}s`,
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

        {/* Support Dialog */}
        <AlertDialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 justify-center">
                <Heart className="h-5 w-5 text-accent" fill="currentColor" />
                Support Noteily!
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Noteily is made with love by Win The Night. If you enjoy using Noteily, consider supporting our work!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-col gap-2">
              <AlertDialogAction
                onClick={() => window.open('https://winthenight.org/support', '_blank')}
                className="w-full bg-accent hover:bg-accent/90"
              >
                Support Us
              </AlertDialogAction>
              <AlertDialogCancel className="w-full">Maybe Later</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
