
import { useState } from 'react';
import { useNotes } from '@/contexts/NoteContext';
import PromptCard from '@/components/prompts/PromptCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const PromptsPage = () => {
  const { writingPrompts, addNote, updateNote, setCurrentNote } = useNotes();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [randomPrompt, setRandomPrompt] = useState(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
  
  const handleUsePrompt = (prompt: typeof randomPrompt) => {
    const newNote = addNote();
    updateNote(newNote.id, {
      title: prompt.text,
      content: `<p>${prompt.text}</p><p><br></p><p>Your thoughts here...</p>`
    });
    setCurrentNote(newNote);
    navigate(`/note/${newNote.id}`);
  };
  
  const handleGetRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * writingPrompts.length);
    setRandomPrompt(writingPrompts[randomIndex]);
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        {isMobile && <SidebarTrigger />}
        <h1 className="text-2xl font-serif font-medium">Writing Prompts</h1>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-serif mb-4">Today's Random Prompt</h2>
        <div className="max-w-xl">
          <PromptCard 
            prompt={randomPrompt} 
            onUsePrompt={handleUsePrompt} 
          />
          <Button 
            variant="ghost" 
            className="mt-3" 
            onClick={handleGetRandomPrompt}
          >
            Get Another Random Prompt
          </Button>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-serif mb-4">All Prompts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {writingPrompts.map((prompt) => (
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
