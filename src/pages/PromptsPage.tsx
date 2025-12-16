
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

const PromptsPage = () => {
  const { dailyPrompts, addNote, updateNote, setCurrentNote, refreshDailyPrompts } = useNotes();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const titleFont = useTitleFont();
  const bodyFont = useBodyFont();
  
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
      <div className="p-4 md:p-8 animate-fade-in">
        {/* Mobile layout */}
        <div className="md:hidden mb-8">
          {/* Top row: Menu button + Logo */}
          <div className="flex items-center justify-between mb-6">
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
              <Heart className="h-6 w-6 text-accent" fill="currentColor" />
            </div>
          </div>

          {/* Centered refresh button */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-11 w-11 rounded-full bg-secondary/70 hover:bg-secondary transition-all duration-250"
              onClick={refreshDailyPrompts}
              title="Refresh prompts"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block mb-8">
          {/* Top row: Menu button + Logo */}
          <div className="flex items-center justify-between mb-6">
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
              <Heart className="h-6 w-6 text-accent" fill="currentColor" />
            </div>
          </div>

          {/* Centered refresh button */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-11 w-11 rounded-full bg-secondary/70 hover:bg-secondary transition-all duration-250"
              onClick={refreshDailyPrompts}
              title="Refresh prompts"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          
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
      </div>
    </div>
  );
};

export default PromptsPage;
