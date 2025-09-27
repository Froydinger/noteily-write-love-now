import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SpellCheckButtonProps {
  content: string;
  onContentChange: (newContent: string) => void;
  disabled?: boolean;
}

export function SpellCheckButton({ content, onContentChange, disabled }: SpellCheckButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const handleSpellCheck = async () => {
    if (!content || content.trim() === '') {
      toast({
        title: "Nothing to check",
        description: "Please add some content to spell check.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('spell-check', {
        body: { text: content }
      });

      if (error) {
        console.error('Spell check error:', error);
        toast({
          title: "Spell check failed",
          description: "Unable to check spelling at this time. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data.hasChanges) {
        onContentChange(data.correctedText);
        toast({
          title: "Spelling corrected! ✨",
          description: "Found and fixed spelling and grammar errors.",
          className: "bg-green-600 text-white border-green-600",
        });
      } else {
        toast({
          title: "Perfect! 👌",
          description: "No spelling or grammar errors found.",
          className: "bg-blue-600 text-white border-blue-600",
        });
      }
    } catch (error) {
      console.error('Spell check error:', error);
      toast({
        title: "Spell check failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button
      onClick={handleSpellCheck}
      disabled={disabled || isChecking}
      variant="outline"
      size="sm"
      className={`
        relative transition-all duration-300 hover:scale-105
        ${isChecking 
          ? 'bg-primary/10 border-primary text-primary animate-pulse shadow-lg shadow-primary/30' 
          : 'hover:bg-primary/5 hover:border-primary/50'
        }
      `}
    >
      <FileCheck 
        className={`h-4 w-4 mr-2 transition-all duration-300 ${
          isChecking ? 'animate-pulse' : ''
        }`} 
      />
      {isChecking ? (
        <>
          <span className="animate-pulse">Checking...</span>
          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 animate-ping opacity-75"></div>
        </>
      ) : (
        'Spell Check'
      )}
    </Button>
  );
}