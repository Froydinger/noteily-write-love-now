import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAiHistory } from '@/hooks/useAiHistory';
import { AiChatDialog } from './AiChatDialog';
import { supabase } from '@/integrations/supabase/client';

interface TextEnhancementMenuProps {
  content: string;
  originalHTML: string;
  onContentChange: (newContent: string, isSelectionReplacement?: boolean) => void;
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
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [hasTextSelected, setHasTextSelected] = useState(false);
  const [isChatHidden, setIsChatHidden] = useState(false);
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const { history, addHistoryEntry, revertToVersion, clearHistory } = useAiHistory(noteId);

  // Function to get selected text and range
  const getSelectedText = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      return {
        text: selection.toString().trim(),
        range: selection.getRangeAt(0).cloneRange()
      };
    }
    return { text: '', range: null };
  };

  // Check for text selection periodically
  React.useEffect(() => {
    const checkSelection = () => {
      const selection = getSelectedText();
      setHasTextSelected(selection.text.length > 0);
    };

    // Check immediately
    checkSelection();

    // Add event listeners for selection changes
    document.addEventListener('selectionchange', checkSelection);
    document.addEventListener('mouseup', checkSelection);
    document.addEventListener('keyup', checkSelection);

    return () => {
      document.removeEventListener('selectionchange', checkSelection);
      document.removeEventListener('mouseup', checkSelection);
      document.removeEventListener('keyup', checkSelection);
    };
  }, []);

  // Handle opening chat dialog with enhanced text selection
  const getEnhancedSelectedContent = () => {
    // Always return full content - selected text editing disabled for now
    return content;
  };

  const handleOpenChatDialog = () => {
    const selection = getSelectedText();
    setSelectedText(selection.text);
    setShowChatDialog(true);
  };

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
          originalHTML: originalHTML,
          action: 'spell'
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== content) {
        // Use AI's HTML output directly - it preserves structure better
        const correctedHTML = data.correctedContent;
        
        // Add to history before changing content
        await addHistoryEntry('spell', content, data.correctedContent, noteTitle, noteTitle);
        
        onContentChange(correctedHTML, hasTextSelected);
        
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
          originalHTML: originalHTML,
          action: 'grammar'
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== content) {
        // Use AI's HTML output directly - it preserves structure better
        const correctedHTML = data.correctedContent;
        
        // Add to history before changing content
        await addHistoryEntry('grammar', content, data.correctedContent, noteTitle, noteTitle);
        
        onContentChange(correctedHTML, hasTextSelected);
        
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

  const handleAIUndo = async () => {
    // Revert to the original content before any AI changes
    if (!originalContentBackup) {
      toast({
        title: "Nothing to revert",
        description: "No original content available to restore.",
        variant: "destructive",
      });
      return;
    }

    onContentChange(originalContentBackup.content);
    if (originalContentBackup.title && originalContentBackup.title !== noteTitle) {
      onTitleChange(originalContentBackup.title);
    }
    
    // Clear the backup since we've reverted
    setOriginalContentBackup(null);
    
    toast({
      title: "Reverted to original",
      description: "Content has been restored to original state before AI changes.",
    });
  };

  // Store original content backup when AI operations start
  const [originalContentBackup, setOriginalContentBackup] = React.useState<{content: string, title: string} | null>(null);
  
  React.useEffect(() => {
    if (!originalContentBackup) {
      setOriginalContentBackup({
        content: content,
        title: noteTitle
      });
    }
  }, []);

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

  return createPortal(
     <>
      {/* Floating AI button - always visible when chat is hidden */}
      {(!showChatDialog || isChatHidden) && (
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled || isProcessing}
              onClick={!isDropdownOpen ? (() => {
                setIsChatHidden(false);
                handleOpenChatDialog();
              }) : undefined}
              className="!fixed !z-[9999] h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 flex items-center justify-center p-0"
              style={{
                bottom: 'max(env(safe-area-inset-bottom), 16px)',
                right: 'max(env(safe-area-inset-right), 16px)',
                left: 'auto',
                top: 'auto'
              }}
              title={isDropdownOpen ? (hasTextSelected ? "AI Enhancement Menu - Text Selected" : "AI Enhancement Menu") : "Chat with AI"}
            >
              {isProcessing ? (
                <Wand2 className="h-5 w-5" />
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
            <DropdownMenuItem onClick={() => {
              setIsChatHidden(false);
              handleOpenChatDialog();
            }} disabled={isProcessing}>
              <PenTool className="mr-2 h-4 w-4" />
              Chat with AI
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAIUndo} disabled={isProcessing || !originalContentBackup}>
              <Undo2 className="mr-2 h-4 w-4" />
              Revert to Original {!originalContentBackup ? '(No backup)' : ''}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* AI Chat Dialog */}
      <AiChatDialog
        open={showChatDialog && !isChatHidden}
        onOpenChange={(open) => {
          setShowChatDialog(open);
          if (!open) setIsChatHidden(false);
        }}
        onHide={() => setIsChatHidden(true)}
        content={getEnhancedSelectedContent()}
        originalHTML={originalHTML}
        noteTitle={noteTitle}
        onContentChange={onContentChange}
        onTitleChange={onTitleChange}
        history={history}
        onRevertToVersion={revertToVersion}
        onAddHistoryEntry={addHistoryEntry}
        hasTextSelected={false}
      />

      {/* Bottom left loading indicator */}
      {isProcessing && (
        <div className="fixed z-50 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg apple-pwa-floating" style={{ bottom: 'auto', top: 'auto', left: 'max(env(safe-area-inset-left), 16px)' }}>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          <span className="text-sm text-muted-foreground">Processing with AI...</span>
        </div>
      )}
    </>,
    document.body
  );
}