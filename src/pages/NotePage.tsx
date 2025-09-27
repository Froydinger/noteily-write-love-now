
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '@/contexts/NoteContext';
import NoteEditor from '@/components/notes/NoteEditor';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash, PanelLeft, PanelLeftClose, ImagePlus, Users, Eye, Edit, Type, Undo2, Redo2 } from 'lucide-react';
import { BlockHandle, BlockType } from '@/components/notes/BlockHandle';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from '@/hooks/use-mobile';
import { FeaturedImageUpload } from '@/components/notes/FeaturedImageUpload';
import { ExportMenu } from '@/components/notes/ExportMenu';
import { ShareManager } from '@/components/notes/ShareManager';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { handleNoteKeyboard } from '@/lib/viewport';
import { useUndoRedo } from '@/hooks/useUndoRedo';

interface UndoRedoState {
  title: string;
  content: string;
}

const NotePage = () => {
  const { id } = useParams<{ id: string }>();
  const { getNote, setCurrentNote, deleteNote, loading, updateNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { state, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [showShareManager, setShowShareManager] = useState(false);
  const [entered, setEntered] = useState(false);
  const [showFormatHandle, setShowFormatHandle] = useState(false);
  const [currentBlockType, setCurrentBlockType] = useState<BlockType>('p');
  const { saveState, undo, redo, canUndo, canRedo, clearHistory } = useUndoRedo();
  const headerRef = useRef<HTMLElement>(null);
  
  const note = getNote(id || '');
  
  // Simplified keyboard handling
  useEffect(() => {
    const cleanup = handleNoteKeyboard();
    return cleanup;
  }, []);
  
  useEffect(() => {
    if (note) {
      setCurrentNote(note);
    } else if (id) {
      // Navigate home if note doesn't exist
      navigate('/');
    }
    
    return () => setCurrentNote(null);
  }, [id, note, navigate, setCurrentNote]);

  // Always start at top when opening a note + play enter transition (no autofocus)
  useEffect(() => {
    setEntered(false);
    // Blur any focused element to prevent iOS jumping to inputs
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
  }, [id]);


  const handleBlockTypeSelect = (type: BlockType) => {
    // Find the content editor and apply formatting
    const contentEditor = document.querySelector('[contenteditable="true"]') as HTMLElement;
    if (!contentEditor) return;
    
    contentEditor.focus();
    try {
      document.execCommand('formatBlock', false, type === 'p' ? 'p' : type);
    } catch (e) {
      // no-op
    }
    
    // Trigger content change event
    contentEditor.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const handleDelete = () => {
    if (id) {
      deleteNote(id);
      
      if (note?.isSharedWithUser && !note?.isOwnedByUser) {
        // It's a shared note - user is removing their access
        toast({
          title: "Access removed",
          description: "You no longer have access to this shared note.",
        });
      } else {
        // User owns the note - it's being moved to recently deleted
        toast({
          title: "Note moved to Recently Deleted",
          description: "You can restore this note within 7 days.",
        });
      }
      navigate('/');
    }
  };
  
  const handleCopy = () => {
    if (!note) return;
    
    // Create a clean plain text version without artificial line breaks
    const contentElement = document.createElement('div');
    contentElement.innerHTML = note.content;
    
    // Extract text content and normalize whitespace to remove artificial line breaks
    const textContent = contentElement.textContent || contentElement.innerText || '';
    const cleanText = textContent.replace(/\s+/g, ' ').trim();
    const plainText = `${note.title}\n\n${cleanText}`;
    
    navigator.clipboard.writeText(plainText).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Note content copied to clipboard.",
      });
    }).catch(err => {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
      console.error('Copy failed:', err);
    });
  };
  
  const handleShare = async () => {
    if (!note) return;
    
    // Create a clean plain text version
    const contentElement = document.createElement('div');
    contentElement.innerHTML = note.content;
    const textContent = contentElement.textContent || contentElement.innerText || '';
    const cleanText = textContent.replace(/\s+/g, ' ').trim();
    const plainText = `${note.title}\n\n${cleanText}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: note.title || 'Untitled Note',
          text: plainText,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        handleCopy();
        toast({
          title: "No share functionality",
          description: "Content copied to clipboard instead.",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleFeaturedImageSet = (imageUrl: string) => {
    if (note) {
      updateNote(note.id, { featured_image: imageUrl }, true);
    }
  };

  const handleUndo = () => {
    if (!note) return;
    
    const currentState = { title: note.title, content: note.content };
    const undoneState = undo(currentState);
    
    if (undoneState) {
      updateNote(note.id, { title: undoneState.title, content: undoneState.content }, false);
      
      toast({
        title: "Undone",
        description: "Note reverted to previous state.",
      });
    }
  };

  const handleRedo = () => {
    if (!note) return;
    
    const currentState = { title: note.title, content: note.content };
    const redoneState = redo(currentState);
    
    if (redoneState) {
      updateNote(note.id, { title: redoneState.title, content: redoneState.content }, false);
      
      toast({
        title: "Redone",
        description: "Note restored to next state.",
      });
    }
  };

  const storeUndoState = () => {
    if (note) {
      saveState(note.title, note.content);
    }
  };

  
  if (!note) {
    return <div className="p-8">Note not found</div>;
  }
  
  return (
    <div key={id} className={`min-h-screen transform transition-all duration-300 ease-out ${entered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
      <header 
        ref={headerRef}
        data-note-header
        className="sticky top-0 z-[100] bg-background border-b p-3"
        style={{ position: 'sticky', top: 0, zIndex: 100 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isMobile ? (
              <div className="relative">
                <SidebarTrigger />
                {user && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-medium">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSidebar}
                  className="btn-accessible p-2"
                  title={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
                >
                  {state === "expanded" ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
                </Button>
                {user && unreadCount > 0 && state === "collapsed" && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-medium">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="btn-accessible p-2"
              title="Back to notes"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {note.isSharedWithUser && (
              <Badge variant="secondary" className="ml-1 flex items-center gap-1 px-2">
                <Users className="h-3 w-3" />
                {note.userPermission === 'read' ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <Edit className="h-3 w-3" />
                )}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Undo/Redo buttons - only show if not read-only */}
            {(!note.isSharedWithUser || note.userPermission !== 'read') && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`btn-accessible p-2 ${!canUndo ? 'opacity-30' : ''}`}
                  title="Undo AI changes"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`btn-accessible p-2 ${!canRedo ? 'opacity-30' : ''}`}
                  title="Redo AI changes"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Formatting button - only show if not read-only */}
            {!note.isSharedWithUser || note.userPermission !== 'read' ? (
              <BlockHandle
                visible={true}
                currentType={currentBlockType}
                onSelect={handleBlockTypeSelect}
              />
            ) : null}
            
            {/* Show people icon for owned notes (to share) or shared notes (to manage) */}
            {(note.isOwnedByUser || (note.isSharedWithUser && !note.isOwnedByUser)) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowShareManager(true)}
                className="btn-accessible p-2"
                title={note.isOwnedByUser ? "Share note" : "Manage sharing"}
              >
                <Users className="h-4 w-4" />
              </Button>
            )}
            
            <FeaturedImageUpload 
              noteId={note.id}
              onImageSet={handleFeaturedImageSet}
              hasImage={!!note.featured_image}
            />
            
            <ExportMenu
              note={note}
              onShare={handleShare}
            />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10">
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
               <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {note.isSharedWithUser && !note.isOwnedByUser ? 'Remove Access' : 'Delete Note'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {note.isSharedWithUser && !note.isOwnedByUser 
                      ? 'Are you sure you want to remove your access to this shared note? You will no longer be able to view or edit it.'
                      : 'Are you sure you want to delete this note? It will be moved to Recently Deleted where you can restore it within 7 days.'
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel className="btn-accessible">Cancel</AlertDialogCancel>
                   <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                     {note.isSharedWithUser && !note.isOwnedByUser ? 'Remove Access' : 'Delete'}
                   </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>
      
      <div className="relative">
        <NoteEditor 
          note={note} 
          onBlockTypeChange={setCurrentBlockType}
          onContentBeforeChange={storeUndoState}
          onSpellCheckApplied={storeUndoState}
        />
      </div>
      
      {/* Share Manager - now accessible from persistent people icon */}
      {showShareManager && (
        <ShareManager
          isOpen={showShareManager}
          onClose={() => setShowShareManager(false)}
          note={note}
          onShareUpdate={() => {
            setShowShareManager(false);
            // Force re-render to update note sharing state
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default NotePage;
