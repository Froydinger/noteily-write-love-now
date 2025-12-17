
import { useState } from 'react';
import { useNotes } from '@/contexts/NoteContext';
import PromptCard from '@/components/prompts/PromptCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { RefreshCw, Heart } from 'lucide-react';
import { useTitleFont } from '@/hooks/useTitleFont';
import { useBodyFont } from '@/hooks/useTitleFont';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const PromptsPage = () => {
  const { dailyPrompts, addNote, updateNote, setCurrentNote, refreshDailyPrompts } = useNotes();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const titleFont = useTitleFont();
  const bodyFont = useBodyFont();
  const [showSupportDialog, setShowSupportDialog] = useState(false);

  const handleUsePrompt = async (prompt: typeof dailyPrompts[0]) => {
    try {
      const newNote = await addNote();
      await updateNote(newNote.id, {
        title: prompt.text,
        content: `<p>${prompt.text}</p><p><br></p><p>Your thoughts here...</p>`
      });
      setCurrentNote(newNote);
      navigate(`/note/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note from prompt:', error);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky floating header */}
      <header className="sticky top-0 z-50 p-4 md:p-8 pb-4 pwa-safe-top">
        {/* Mobile layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4">
            {(isMobile || state === "collapsed") && (
              <div className="relative">
                <SidebarTrigger className="h-10 w-10 rounded-full bg-secondary/50 hover:bg-secondary transition-all duration-250" />
                {user && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent rounded-full flex items-center justify-center text-[10px] text-accent-foreground font-semibold shadow-glow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setShowSupportDialog(true)} className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 hover:from-accent/30 hover:to-accent/10 transition-all duration-200">
              <Heart className="h-6 w-6 text-accent" fill="currentColor" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" className="h-11 w-11 rounded-full bg-secondary/70 hover:bg-secondary transition-all duration-250" onClick={refreshDailyPrompts} title="Refresh prompts">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <div>
              {state === "collapsed" && (
                <div className="relative">
                  <SidebarTrigger className="h-10 w-10 rounded-full bg-secondary/50 hover:bg-secondary transition-all duration-250" />
                  {user && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent rounded-full flex items-center justify-center text-[10px] text-accent-foreground font-semibold shadow-glow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setShowSupportDialog(true)} className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 hover:from-accent/30 hover:to-accent/10 transition-all duration-200">
              <Heart className="h-6 w-6 text-accent" fill="currentColor" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" className="h-11 w-11 rounded-full bg-secondary/70 hover:bg-secondary transition-all duration-250" onClick={refreshDailyPrompts} title="Refresh prompts">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-8 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {dailyPrompts.map((prompt) => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt} 
              onUsePrompt={handleUsePrompt} 
            />
          ))}
        </div>
      </div>

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
  );
};

export default PromptsPage;
