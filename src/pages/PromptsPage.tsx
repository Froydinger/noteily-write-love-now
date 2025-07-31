
import { useState } from 'react';
import { useNotes } from '@/contexts/NoteContext';
import PromptCard from '@/components/prompts/PromptCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { RefreshCw } from 'lucide-react';

const PromptsPage = () => {
  const { dailyPrompts, addNote, updateNote, setCurrentNote, refreshDailyPrompts } = useNotes();
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
    <div className="h-full">
      <div className="p-4 md:p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {(isMobile || state === "collapsed") && <SidebarTrigger />}
            <h1 className="text-2xl font-serif font-medium">Daily Writing Prompts</h1>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            className="btn-accessible hidden sm:flex rounded-full"
            onClick={refreshDailyPrompts}
          >
            Refresh
            <span className="text-xs ml-1 text-muted-foreground">(resets at midnight)</span>
          </Button>
          
          {/* Mobile version - icon only */}
          <Button 
            variant="outline" 
            size="sm"
            className="btn-accessible sm:hidden rounded-full"
            onClick={refreshDailyPrompts}
            title="Refresh prompts"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
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
