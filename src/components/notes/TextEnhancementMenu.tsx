import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  BookOpen, 
  PenTool, 
  Undo2,
  Wand2,
  Type
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
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAiHistory } from '@/hooks/useAiHistory';
import { supabase } from '@/integrations/supabase/client';

interface TextEnhancementMenuProps {
  content: string;
  originalHTML: string;
  onContentChange: (newContent: string) => void;
  noteTitle: string;
  onTitleChange: (newTitle: string) => void;
  disabled?: boolean;
  previousContent?: string;
  previousTitle?: string;
  noteId: string;
}

export function TextEnhancementMenu({
  content,
  originalHTML,
  onContentChange,
  noteTitle,
  onTitleChange,
  disabled = false,
  previousContent,
  previousTitle,
  noteId
}: TextEnhancementMenuProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [rewriteInstructions, setRewriteInstructions] = useState('');
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const { history, addHistoryEntry, revertToVersion, clearHistory } = useAiHistory(noteId);

  const handleSpellCheck = async () => {
    if (!content.trim()) {
      toast({
        title: "No text to check",
        description: "Please write some text first.",
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
        
        // Add to history before changing content
        await addHistoryEntry('spell', content, data.correctedContent, noteTitle, noteTitle);
        
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
        title: "No text to check",
        description: "Please write some text first.",
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
        
        // Add to history before changing content
        await addHistoryEntry('grammar', content, data.correctedContent, noteTitle, noteTitle);
        
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

  const handleRewrite = async (instructions?: string) => {
    const instructionsToUse = instructions || rewriteInstructions;
    
    if (!content.trim()) {
      toast({
        title: "No text to rewrite",
        description: "Please write some text first.",
        variant: "destructive",
      });
      return;
    }

    if (!instructionsToUse.trim()) {
      toast({
        title: "No instructions provided",
        description: "Please provide instructions for how to rewrite the text.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('About to call edge function');
      
      const response = await supabase.functions.invoke('spell-check', {
        body: { 
          content: content,
          title: noteTitle,
          action: 'rewrite',
          instructions: instructionsToUse
        }
      });

      console.log('Got response:', response);
      
      if (response.error) {
        console.error('Function error:', response.error);
        throw new Error(response.error.message || 'Function failed');
      }

      if (response.data && response.data.correctedContent) {
        console.log('Success! Updating content with:', response.data.correctedContent);
        console.log('Original content was:', content);
        
        // Add to history before changing content
        await addHistoryEntry(
          'rewrite',
          content,
          response.data.correctedContent,
          noteTitle,
          response.data.newTitle || noteTitle,
          instructionsToUse
        );
        
        console.log('Calling onContentChange...');
        onContentChange(response.data.correctedContent);
        console.log('onContentChange called');
        
        if (response.data.newTitle && response.data.newTitle !== noteTitle) {
          console.log('Updating title to:', response.data.newTitle);
          onTitleChange(response.data.newTitle);
        }
        
        toast({
          title: "Text rewritten",
          description: "Your content has been rewritten according to your instructions.",
        });
        
        setShowRewriteDialog(false);
        setRewriteInstructions('');
      } else {
        console.error('No content returned:', response.data);
        throw new Error('No rewritten content received');
      }
    } catch (error) {
      console.error('Rewrite error:', error);
      toast({
        title: "Rewrite failed", 
        description: error.message || "There was an error rewriting your text.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIUndo = async () => {
    // Use the most recent history entry instead of previousContent
    if (history.length === 0) {
      toast({
        title: "Nothing to undo",
        description: "No previous AI changes available to restore.",
        variant: "destructive",
      });
      return;
    }

    const lastEntry = history[0];
    const revertData = await revertToVersion(lastEntry);
    
    onContentChange(revertData.content);
    if (revertData.title && revertData.title !== noteTitle) {
      onTitleChange(revertData.title);
    }
    
    toast({
      title: "Changes undone",
      description: "Content has been reverted to previous version.",
    });
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

  // Don't render if AI is disabled
  if (!preferences.aiEnabled) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || isProcessing}
            className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
            title="AI Enhancement Menu"
          >
            {isProcessing ? (
              <Wand2 className="h-5 w-5 animate-spin" />
            ) : (
              <Brain className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-sm border border-border/50">
          <DropdownMenuItem onClick={handleSpellCheck} disabled={isProcessing}>
            <Type className="mr-2 h-4 w-4" />
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
          <DropdownMenuItem onClick={handleAIUndo} disabled={isProcessing || history.length === 0}>
            <Undo2 className="mr-2 h-4 w-4" />
            AI Undo {history.length === 0 ? '(No history)' : ''}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowHistoryDialog(true)} disabled={isProcessing}>
            <BookOpen className="mr-2 h-4 w-4" />
            View AI History
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showRewriteDialog} onOpenChange={setShowRewriteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Rewrite with AI
              {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              )}
            </DialogTitle>
            <DialogDescription>
              {isProcessing 
                ? "AI is processing your request..." 
                : "Tell the AI how you'd like to rewrite your content. The formatting and structure will be preserved unless you specify otherwise."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Quick suggestion buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRewrite("Make this more professional and formal")}
                disabled={isProcessing}
                className="text-xs"
              >
                Professional
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRewrite("Make this more casual and friendly")}
                disabled={isProcessing}
                className="text-xs"
              >
                Casual
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRewrite("Expand this text with more details and examples")}
                disabled={isProcessing}
                className="text-xs"
              >
                Expand
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRewrite("Make this shorter and more concise")}
                disabled={isProcessing}
                className="text-xs"
              >
                Shorten
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRewrite("Make this more upbeat, positive and happier")}
                disabled={isProcessing}
                className="text-xs"
              >
                Happier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRewrite("Make this more formal and business-appropriate")}
                disabled={isProcessing}
                className="text-xs"
              >
                Formal
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or custom instructions
                </span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="instructions">Custom Rewrite Instructions</Label>
              <Input
                id="instructions"
                placeholder="e.g., add more examples, change tone, fix structure..."
                value={rewriteInstructions}
                onChange={(e) => setRewriteInstructions(e.target.value)}
                className="mt-1"
                disabled={isProcessing}
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
                onClick={() => handleRewrite()}
                disabled={isProcessing || !rewriteInstructions.trim()}
              >
                Rewrite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>AI Chat History</DialogTitle>
            <DialogDescription>
              View and revert to previous AI changes for this note.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-3 pr-2">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No AI changes yet</p>
                <p className="text-sm">AI changes will appear here as you use spell check, grammar correction, or rewriting features.</p>
              </div>
            ) : (
              history.map((entry, index) => (
                <div key={entry.id} className="border rounded-lg p-3 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{entry.action_type}</span>
                      {entry.instruction && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">{entry.instruction}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const revertData = await revertToVersion(entry);
                          onContentChange(revertData.content);
                          if (revertData.title && revertData.title !== noteTitle) {
                            onTitleChange(revertData.title);
                          }
                          setShowHistoryDialog(false);
                          toast({
                            title: "Reverted",
                            description: "Content has been reverted to selected version.",
                          });
                        }}
                        className="text-xs"
                      >
                        Revert
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {entry.original_title !== entry.new_title && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Title changed:</div>
                        <div className="text-sm bg-muted/50 p-2 rounded">
                          <div className="line-through text-muted-foreground">{entry.original_title}</div>
                          <div>{entry.new_title}</div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Content preview:</div>
                      <div className="text-sm bg-muted/50 p-2 rounded max-h-20 overflow-hidden">
                        {entry.new_content.substring(0, 150)}
                        {entry.new_content.length > 150 && '...'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={async () => {
                await clearHistory();
                setShowHistoryDialog(false);
              }}
              disabled={history.length === 0}
              className="text-xs"
            >
              Clear History
            </Button>
            <Button
              onClick={() => setShowHistoryDialog(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom left loading indicator */}
      {isProcessing && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          <span className="text-sm text-muted-foreground">Processing with AI...</span>
        </div>
      )}
    </>
  );
}