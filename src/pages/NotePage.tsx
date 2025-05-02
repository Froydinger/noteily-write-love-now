
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '@/contexts/NoteContext';
import NoteEditor from '@/components/notes/NoteEditor';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash, PanelLeft, PanelLeftClose, Copy, Share } from 'lucide-react';
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

const NotePage = () => {
  const { id } = useParams<{ id: string }>();
  const { getNote, setCurrentNote, deleteNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { state, toggleSidebar } = useSidebar();
  
  const note = getNote(id || '');
  
  useEffect(() => {
    if (note) {
      setCurrentNote(note);
    } else if (id) {
      navigate('/not-found');
    }
    
    return () => setCurrentNote(null);
  }, [id, note, navigate, setCurrentNote]);
  
  const handleDelete = () => {
    if (id) {
      deleteNote(id);
      toast({
        title: "Note deleted",
        description: "Your note has been deleted.",
      });
      navigate('/');
    }
  };
  
  const handleCopy = () => {
    if (!note) return;
    
    // Create a plain text version of the note content
    const contentElement = document.createElement('div');
    contentElement.innerHTML = note.content;
    const plainText = `${note.title}\n\n${contentElement.innerText}`;
    
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
    
    // Create a plain text version of the note
    const contentElement = document.createElement('div');
    contentElement.innerHTML = note.content;
    const plainText = `${note.title}\n\n${contentElement.innerText}`;
    
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
  
  if (!note) {
    return <div className="p-8">Loading...</div>;
  }
  
  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMobile ? (
              <SidebarTrigger />
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSidebar}
                className="hover:bg-secondary dark:text-neon-blue"
                title={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
              >
                {state === "expanded" ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
                <span className="ml-2">{state === "expanded" ? "Hide sidebar" : "Show sidebar"}</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground"
              title="Copy note"
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground"
              title="Share note"
            >
              <Share className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Note</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this note? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>
      
      <div className="flex-grow overflow-auto">
        <NoteEditor note={note} />
      </div>
    </div>
  );
};

export default NotePage;
