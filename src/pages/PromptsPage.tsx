
import { useState } from 'react';
import { useNotes } from '@/contexts/NoteContext';
import PromptCard from '@/components/prompts/PromptCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { RefreshCw } from 'lucide-react';

const PromptsPage = () => {
  const { dailyPrompts, addNote, updateNote, setCurrentNote, refreshDailyPrompts } = useNotes();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  
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
        {/* Mobile layout: Daily Writing Prompts text on far right, refresh icon next to it */}
        <div className="md:hidden mb-6">
          {/* Top row: Menu button left, refresh icon + title far right */}
          <div className="flex items-center justify-between mb-4">
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
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="rounded-full hover:scale-105 transition-all duration-150 px-2 py-2"
                onClick={refreshDailyPrompts}
                title="Refresh prompts"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-serif font-medium">Daily Writing Prompts</h1>
            </div>
          </div>
        </div>

        {/* Desktop layout: Menu button left, refresh icon + title far right */}
        <div className="hidden md:flex items-center justify-between mb-6">
          {/* Left side: Menu button */}
          <div className="flex items-center gap-4 px-2 py-2">
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

          {/* Right side: Refresh icon + Title */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="rounded-full hover:scale-105 transition-all duration-150 px-2 py-2"
              onClick={refreshDailyPrompts}
              title="Refresh prompts"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-serif font-medium">Daily Writing Prompts</h1>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground mb-6">
            Here are your three writing prompts for today. New prompts will be available at midnight. 
            Use these to inspire your writing and reflection.
          </p>
          
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
