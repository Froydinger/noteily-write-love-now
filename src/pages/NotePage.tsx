import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotes } from "@/contexts/NoteContext";
import NoteEditor from "@/components/notes/NoteEditor";
import ChecklistEditor from "@/components/notes/ChecklistEditor";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trash, Menu, Users, Eye, Edit, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { FeaturedImageUpload } from "@/components/notes/FeaturedImageUpload";
import { ExportMenu } from "@/components/notes/ExportMenu";
import { ShareManager } from "@/components/notes/ShareManager";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { handleNoteKeyboard } from "@/lib/viewport";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useAiButton } from "@/contexts/AiButtonContext";

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
  const { saveState } = useUndoRedo();
  const { isAiButtonVisible, openAiChat } = useAiButton();
  const [aiReplacementFunction, setAiReplacementFunction] = useState<
    ((newContent: string, isSelectionReplacement: boolean) => void) | null
  >(null);
  const headerRef = useRef<HTMLElement>(null);

  const note = getNote(id || "");

  // Keyboard handling - let native browser undo/redo work naturally
  useEffect(() => {
    const cleanup = handleNoteKeyboard();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (note) {
      setCurrentNote(note);
    }

    return () => setCurrentNote(null);
  }, [id, note, setCurrentNote]);

  // Always start at top when opening a note + play enter transition (no autofocus)
  useEffect(() => {
    setEntered(false);
    // Blur any focused element to prevent iOS jumping to inputs
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    // Simple timeout instead of nested RAF to reduce main thread blocking
    const timer = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(timer);
  }, [id]);

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
      navigate("/");
    }
  };

  const handleCopy = () => {
    if (!note) return;

    // Create a clean plain text version without artificial line breaks
    const contentElement = document.createElement("div");
    contentElement.innerHTML = note.content;

    // Extract text content and normalize whitespace to remove artificial line breaks
    const textContent = contentElement.textContent || contentElement.innerText || "";
    const cleanText = textContent.replace(/\s+/g, " ").trim();
    const plainText = `${note.title}\n\n${cleanText}`;

    navigator.clipboard
      .writeText(plainText)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Note content copied to clipboard.",
        });
      })
      .catch((err) => {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard.",
          variant: "destructive",
        });
        console.error("Copy failed:", err);
      });
  };

  const handleShare = async () => {
    if (!note) return;

    // Create a clean plain text version
    const contentElement = document.createElement("div");
    contentElement.innerHTML = note.content;
    const textContent = contentElement.textContent || contentElement.innerText || "";
    const cleanText = textContent.replace(/\s+/g, " ").trim();
    const plainText = `${note.title}\n\n${cleanText}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: note.title || "Untitled Note",
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
      console.error("Share failed:", error);
    }
  };

  const handleFeaturedImageSet = (imageUrl: string) => {
    if (note) {
      updateNote(note.id, { featured_image: imageUrl }, true);
    }
  };

  // Store state for AI revert functionality only
  const storeUndoState = () => {
    if (note) {
      saveState(note.title, note.content);
    }
  };

  if (!note) {
    return <div className="p-8">Note not found</div>;
  }

  return (
    <div
      key={id}
      className={`min-h-[100dvh] transform transition-all duration-200 ease-out ${entered ? "translate-x-0 opacity-100" : "translate-x-1 opacity-90"}`}
    >
      <header
        ref={headerRef}
        data-note-header
        className="sticky top-0 z-[100] p-4"
        style={{ position: "sticky", top: 0, zIndex: 100 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer"
                title="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              {user && unreadCount > 0 && state === "collapsed" && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-medium">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer"
              title="Back to notes"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {note.isSharedWithUser && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2">
                <Users className="h-3 w-3" />
                {note.userPermission === "read" ? <Eye className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* AI Writer Button */}
            {isAiButtonVisible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openAiChat}
                className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer"
                title="AI Writer"
              >
                <Brain className="h-5 w-5 text-accent" />
              </Button>
            )}

            {/* Show people icon for owned notes (to share) or shared notes (to manage) */}
            {(note.isOwnedByUser || (note.isSharedWithUser && !note.isOwnedByUser)) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareManager(true)}
                className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer"
                title={note.isOwnedByUser ? "Share note" : "Manage sharing"}
              >
                <Users className="h-5 w-5" />
              </Button>
            )}

            <FeaturedImageUpload
              noteId={note.id}
              onImageSet={handleFeaturedImageSet}
              hasImage={!!note.featured_image}
            />

            <ExportMenu note={note} onShare={handleShare} />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full text-destructive hover:bg-destructive/15 hover:border-destructive/40 transition-all duration-200 shadow-sm glass-shimmer"
                >
                  <Trash className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {note.isSharedWithUser && !note.isOwnedByUser ? "Remove Access" : "Delete Note"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {note.isSharedWithUser && !note.isOwnedByUser
                      ? "Are you sure you want to remove your access to this shared note? You will no longer be able to view or edit it."
                      : "Are you sure you want to delete this note? It will be moved to Recently Deleted where you can restore it within 7 days."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="btn-accessible">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    {note.isSharedWithUser && !note.isOwnedByUser ? "Remove Access" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="relative">
        {note.note_type === "checklist" ? (
          <ChecklistEditor note={note} />
        ) : (
          <NoteEditor
            note={note}
            onContentBeforeChange={storeUndoState}
            onSpellCheckApplied={storeUndoState}
            onAIContentReplace={(replacementFn) => setAiReplacementFunction(() => replacementFn)}
          />
        )}
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
