import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SpellCheckButtonProps {
  content: string;
  originalHTML: string;
  onContentChange: (newContent: string) => void;
  disabled?: boolean;
}

export function SpellCheckButton({ content, originalHTML, onContentChange, disabled }: SpellCheckButtonProps) {
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
        // Preserve original HTML structure while updating text content
        const correctedHTML = preserveHTMLStructure(originalHTML, data.correctedText);
        onContentChange(correctedHTML);
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

  // Function to preserve HTML structure while updating text content
  const preserveHTMLStructure = (originalHTML: string, correctedText: string): string => {
    try {
      // Create a temporary div to parse the original HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = originalHTML;
      
      // Extract text content from original HTML for mapping
      const originalText = tempDiv.textContent || '';
      
      // If the text hasn't changed significantly, return original
      if (originalText.trim() === correctedText.trim()) {
        return originalHTML;
      }
      
      // Create a simple mapping by splitting both texts into words
      const originalWords = originalText.split(/(\s+)/);
      const correctedWords = correctedText.split(/(\s+)/);
      
      // Walk through all text nodes in the DOM and update them
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent?.trim()) {
          textNodes.push(node as Text);
        }
      }
      
      // Simple word-by-word replacement approach
      let correctedWordIndex = 0;
      let correctedTextRemaining = correctedText;
      
      for (const textNode of textNodes) {
        const nodeText = textNode.textContent || '';
        const nodeWords = nodeText.split(/(\s+)/);
        
        let newNodeText = '';
        for (let i = 0; i < nodeWords.length; i++) {
          const word = nodeWords[i];
          
          if (word.trim()) {
            // Find the next non-whitespace word from corrected text
            while (correctedWordIndex < correctedWords.length && !correctedWords[correctedWordIndex].trim()) {
              correctedWordIndex++;
            }
            
            if (correctedWordIndex < correctedWords.length) {
              newNodeText += correctedWords[correctedWordIndex];
              correctedWordIndex++;
            } else {
              newNodeText += word; // Fallback to original if we run out
            }
          } else {
            newNodeText += word; // Preserve whitespace
          }
        }
        
        textNode.textContent = newNodeText;
      }
      
      return tempDiv.innerHTML;
    } catch (error) {
      console.error('Error preserving HTML structure:', error);
      // Fallback: return original HTML if something goes wrong
      return originalHTML;
    }
  };

  return (
    <Button
      onClick={handleSpellCheck}
      disabled={disabled || isChecking}
      variant="outline"
      size="icon"
      className={`
        fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg
        transition-all duration-300 hover:scale-105
        ${isChecking 
          ? 'bg-primary/10 border-primary text-primary animate-pulse shadow-lg shadow-primary/30' 
          : 'hover:bg-primary/5 hover:border-primary/50 bg-background'
        }
      `}
      title={isChecking ? 'Checking spelling...' : 'Spell Check'}
    >
      <FileCheck 
        className={`h-5 w-5 transition-all duration-300 ${
          isChecking ? 'animate-pulse' : ''
        }`} 
      />
      {isChecking && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 animate-ping opacity-75"></div>
      )}
    </Button>
  );
}