
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '@/contexts/NoteContext';
import NoteEditor from '@/components/notes/NoteEditor';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash, PanelLeft, PanelLeftClose, ImagePlus, Users, Eye, Edit } from 'lucide-react';
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

const NotePage = () => {
  const { id } = useParams<{ id: string }>();
  const { getNote, setCurrentNote, deleteNote, loading, updateNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { state, toggleSidebar } = useSidebar();
  
  const note = getNote(id || '');
  
  useEffect(() => {
    if (note) {
      setCurrentNote(note);
    } else if (id) {
      // Navigate home if note doesn't exist
      navigate('/');
    }
    
    return () => setCurrentNote(null);
  }, [id, note, navigate, setCurrentNote]);

  
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
        // User owns the note - it's being permanently deleted
        toast({
          title: "Note deleted",
          description: "Your note has been permanently deleted.",
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
      updateNote(note.id, { featured_image: imageUrl });
    }
  };

  const handleInsertChecklist = () => {
    // This will be handled by the NoteEditor component
    const event = new CustomEvent('insertChecklist');
    document.dispatchEvent(event);
  };
  
  if (!note) {
    return <div className="p-8">Note not found</div>;
  }
  
  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isMobile ? (
              <SidebarTrigger />
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSidebar}
                className="btn-accessible p-2"
                title={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
              >
                {state === "expanded" ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
              </Button>
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
            <FeaturedImageUpload 
              noteId={note.id}
              onImageSet={handleFeaturedImageSet}
              hasImage={!!note.featured_image}
            />
            
            <ExportMenu
              note={note}
              onShare={handleShare}
              onInsertChecklist={handleInsertChecklist}
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
                      : 'Are you sure you want to permanently delete this note? This will delete it for everyone it has been shared with. This action cannot be undone.'
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
      
      <div className="flex-grow">
        <NoteEditor note={note} />
      </div>
    </div>
  );
};

export default NotePage;
