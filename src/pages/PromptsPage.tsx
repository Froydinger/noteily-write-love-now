
import { useState } from 'react';
import { useNotes } from '@/contexts/NoteContext';
import PromptCard from '@/components/prompts/PromptCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const PromptsPage = () => {
  const { dailyPrompts, addNote, updateNote, setCurrentNote, refreshDailyPrompts } = useNotes();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleUsePrompt = (prompt: typeof dailyPrompts[0]) => {
    const newNote = addNote();
    updateNote(newNote.id, {
      title: prompt.text,
      content: `<p>${prompt.text}</p><p><br></p><p>Your thoughts here...</p>`
    });
    setCurrentNote(newNote);
    navigate(`/note/${newNote.id}`);
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger />}
          <h1 className="text-2xl font-serif font-medium">Daily Writing Prompts</h1>
        </div>
        
        <Button 
          variant="outline" 
          className="text-xs"
          onClick={refreshDailyPrompts}
        >
          Refresh
          <span className="text-xs ml-1 text-muted-foreground">(resets automatically at midnight)</span>
        </Button>
      </div>
      
      <div className="mb-6">
        <p className="text-muted-foreground mb-6">
          Here are your three writing prompts for today. New prompts will be available at midnight. 
          Use these to inspire your writing and reflection.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
};

export default PromptsPage;
