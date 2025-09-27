import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileCheck, 
  BookOpen, 
  PenTool, 
  Undo2,
  Wand2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TextEnhancementMenuProps {
  content: string;
  originalHTML: string;
  onContentChange: (newContent: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  noteTitle: string;
  onTitleChange: (newTitle: string) => void;
  disabled?: boolean;
}

export function TextEnhancementMenu({
  content,
  originalHTML,
  onContentChange,
  onUndo,
  canUndo = false,
  noteTitle,
  onTitleChange,
  disabled = false
}: TextEnhancementMenuProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [rewriteInstructions, setRewriteInstructions] = useState('');
  const { toast } = useToast();

  const handleSpellCheck = async () => {
    if (!content.trim()) {
      toast({
        title: "No content to check",
        description: "Please write some content first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('spell-check', {
        body: { 
          content: content,
          action: 'spell'
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== content) {
        const preservedHTML = preserveHTMLStructure(originalHTML, data.correctedContent);
        onContentChange(preservedHTML);
        
        toast({
          title: "Spelling corrected",
          description: "Fixed spelling errors in your note.",
        });
      } else {
        toast({
          title: "No spelling errors found",
          description: "Your text looks good!",
        });
      }
    } catch (error) {
      console.error('Spell check failed:', error);
      toast({
        title: "Spell check failed",
        description: "There was an error checking your spelling.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGrammarCheck = async () => {
    if (!content.trim()) {
      toast({
        title: "No content to check",
        description: "Please write some content first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('spell-check', {
        body: { 
          content: content,
          action: 'grammar'
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== content) {
        const preservedHTML = preserveHTMLStructure(originalHTML, data.correctedContent);
        onContentChange(preservedHTML);
        
        toast({
          title: "Grammar corrected",
          description: "Fixed grammar issues in your note.",
        });
      } else {
        toast({
          title: "No grammar errors found",
          description: "Your text looks good!",
        });
      }
    } catch (error) {
      console.error('Grammar check failed:', error);
      toast({
        title: "Grammar check failed",
        description: "There was an error checking your grammar.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRewrite = async () => {
    if (!content.trim()) {
      toast({
        title: "No content to rewrite",
        description: "Please write some content first.",
        variant: "destructive",
      });
      return;
    }

    if (!rewriteInstructions.trim()) {
      toast({
        title: "No instructions provided",
        description: "Please provide instructions for how to rewrite the text.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('spell-check', {
        body: { 
          content: content,
          title: noteTitle,
          action: 'rewrite',
          instructions: rewriteInstructions
        }
      });

      if (error) throw error;

      if (data.correctedContent) {
        onContentChange(data.correctedContent);
        
        // Update title if provided
        if (data.newTitle && data.newTitle !== noteTitle) {
          onTitleChange(data.newTitle);
        }
        
        toast({
          title: "Text rewritten",
          description: "Your content has been rewritten according to your instructions.",
        });
        
        setShowRewriteDialog(false);
        setRewriteInstructions('');
      }
    } catch (error) {
      console.error('Rewrite failed:', error);
      toast({
        title: "Rewrite failed",
        description: "There was an error rewriting your text.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Preserve HTML structure while replacing text content
  const preserveHTMLStructure = (originalHTML: string, newText: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(originalHTML, 'text/html');
      const newWords = newText.split(/\s+/);
      let wordIndex = 0;

      const walkTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const textLength = node.textContent?.split(/\s+/).filter(word => word.length > 0).length || 0;
          const replacement = newWords.slice(wordIndex, wordIndex + textLength).join(' ');
          if (replacement) {
            node.textContent = replacement;
            wordIndex += textLength;
          }
        } else {
          node.childNodes.forEach(walkTextNodes);
        }
      };

      walkTextNodes(doc.body);
      return doc.body.innerHTML;
    } catch (error) {
      console.error('Error preserving HTML structure:', error);
      return newText;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || isProcessing}
            className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
            title="Text Enhancement Menu"
          >
            {isProcessing ? (
              <Wand2 className="h-5 w-5 animate-spin" />
            ) : (
              <FileCheck className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-sm border border-border/50">
          <DropdownMenuItem onClick={handleSpellCheck} disabled={isProcessing}>
            <FileCheck className="mr-2 h-4 w-4" />
            Correct Spelling
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleGrammarCheck} disabled={isProcessing}>
            <BookOpen className="mr-2 h-4 w-4" />
            Correct Grammar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowRewriteDialog(true)} disabled={isProcessing}>
            <PenTool className="mr-2 h-4 w-4" />
            Rewrite with AI
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onUndo} disabled={!canUndo || isProcessing}>
            <Undo2 className="mr-2 h-4 w-4" />
            Undo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showRewriteDialog} onOpenChange={setShowRewriteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rewrite with AI</DialogTitle>
            <DialogDescription>
              Tell the AI how you'd like to rewrite your content. The formatting and structure will be preserved unless you specify otherwise.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="instructions">Rewrite Instructions</Label>
              <Input
                id="instructions"
                placeholder="e.g., make it more formal, add humor, simplify the language..."
                value={rewriteInstructions}
                onChange={(e) => setRewriteInstructions(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRewriteDialog(false);
                  setRewriteInstructions('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRewrite}
                disabled={isProcessing || !rewriteInstructions.trim()}
              >
                {isProcessing ? 'Rewriting...' : 'Rewrite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}