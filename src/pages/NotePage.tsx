
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '@/contexts/NoteContext';
import NoteEditor from '@/components/notes/NoteEditor';
import { BlockType } from '@/components/notes/BlockHandle';
import { useToast } from '@/hooks/use-toast';
import { ShareManager } from '@/components/notes/ShareManager';
import { useAuth } from '@/contexts/AuthContext';
import { handleNoteKeyboard } from '@/lib/viewport';
import { HeaderContent } from '@/components/notes/HeaderContent';

const NotePage = () => {
  const { id } = useParams<{ id: string }>();
  const { getNote, setCurrentNote, deleteNote, loading, updateNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showShareManager, setShowShareManager] = useState(false);
  const [entered, setEntered] = useState(false);
  const [currentBlockType, setCurrentBlockType] = useState<BlockType>('p');
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  
  const note = getNote(id || '');
  
  // Simplified keyboard handling
  useEffect(() => {
    const cleanup = handleNoteKeyboard();
    return cleanup;
  }, []);

  // Set up IntersectionObserver to detect when original header goes out of view
  useEffect(() => {
    if (!headerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky header when original header is not visible
        setShowStickyHeader(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px' // Trigger slightly before header disappears
      }
    );

    observer.observe(headerRef.current);

    return () => {
      observer.disconnect();
    };
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

  
  if (!note) {
    return <div className="p-8">Note not found</div>;
  }
  
  return (
    <div key={id} className={`min-h-screen transform transition-all duration-300 ease-out ${entered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`} style={{ paddingTop: '73px' }}>
      {/* Original header - no longer sticky */}
      <header 
        ref={headerRef}
        data-note-header
        className="relative bg-background border-b p-3"
      >
        <HeaderContent 
          note={note}
          currentBlockType={currentBlockType}
          onBlockTypeSelect={handleBlockTypeSelect}
          onDelete={handleDelete}
          onShare={handleShare}
          onFeaturedImageSet={handleFeaturedImageSet}
          onShowShareManager={() => setShowShareManager(true)}
        />
      </header>

      {/* Sticky header that appears on scroll */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b p-3 transition-transform duration-300 ease-out ${
          showStickyHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <HeaderContent 
          note={note}
          currentBlockType={currentBlockType}
          onBlockTypeSelect={handleBlockTypeSelect}
          onDelete={handleDelete}
          onShare={handleShare}
          onFeaturedImageSet={handleFeaturedImageSet}
          onShowShareManager={() => setShowShareManager(true)}
        />
      </header>
      
      <div className="relative">
        <NoteEditor 
          note={note} 
          onBlockTypeChange={setCurrentBlockType}
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
