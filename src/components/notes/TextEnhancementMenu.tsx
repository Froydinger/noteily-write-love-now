import React, { useState, useEffect } from 'react';
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
import { toast } from '@/components/ui/sonner';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAiHistory } from '@/hooks/useAiHistory';
import { useAiButton } from '@/contexts/AiButtonContext';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const { preferences } = usePreferences();
  const { history, addHistoryEntry, revertToVersion, clearHistory } = useAiHistory(noteId);
  const { registerAiButton, unregisterAiButton, isAiChatOpen, setIsAiChatOpen } = useAiButton();
  const isMobile = useIsMobile();

  // Register AI button with context for mobile bottom nav
  useEffect(() => {
    if (isMobile && preferences.aiEnabled) {
      registerAiButton({
        content,
        originalHTML,
        noteTitle,
        noteId,
        onContentChange,
        onTitleChange,
        disabled,
      });
    }
    return () => {
      if (isMobile) {
        unregisterAiButton();
      }
    };
  }, [isMobile, preferences.aiEnabled, content, originalHTML, noteTitle, noteId, disabled]);

  // Listen for AI chat open from bottom nav
  useEffect(() => {
    if (isAiChatOpen && isMobile) {
      setShowChatDialog(true);
      setIsChatHidden(false);
    }
  }, [isAiChatOpen, isMobile]);

  // Sync dialog state back to context
  useEffect(() => {
    if (!showChatDialog && isMobile) {
      setIsAiChatOpen(false);
    }
  }, [showChatDialog, isMobile, setIsAiChatOpen]);

  const getSelectedText = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      return { text: selection.toString().trim(), range: selection.getRangeAt(0).cloneRange() };
    }
    return { text: '', range: null };
  };

  useEffect(() => {
    const checkSelection = () => {
      const selection = getSelectedText();
      setHasTextSelected(selection.text.length > 0);
    };
    checkSelection();
    document.addEventListener('selectionchange', checkSelection);
    document.addEventListener('mouseup', checkSelection);
    document.addEventListener('keyup', checkSelection);
    return () => {
      document.removeEventListener('selectionchange', checkSelection);
      document.removeEventListener('mouseup', checkSelection);
      document.removeEventListener('keyup', checkSelection);
    };
  }, []);

  const getEnhancedSelectedContent = () => content;

  const handleOpenChatDialog = () => {
    const selection = getSelectedText();
    setSelectedText(selection.text);
    setShowChatDialog(true);
  };

  const handleSpellCheck = async () => {
    if (!content.trim()) {
      toast.error("No text to check");
      return;
    }
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('spell-check', {
        body: { content: originalHTML, originalHTML, action: 'spell' }
      });
      if (error) throw error;
      if (data.correctedContent && data.correctedContent !== originalHTML) {
        await addHistoryEntry('spell', originalHTML, data.correctedContent, noteTitle, noteTitle);
        onContentChange(data.correctedContent, false);
        toast.success("Spelling corrected");
      } else {
        toast.success("No spelling errors found");
      }
    } catch (error) {
      console.error('Spell check failed:', error);
      toast.error("Spell check failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGrammarCheck = async () => {
    if (!content.trim()) {
      toast.error("No text to check");
      return;
    }
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('spell-check', {
        body: { content: originalHTML, originalHTML, action: 'grammar' }
      });
      if (error) throw error;
      if (data.correctedContent && data.correctedContent !== originalHTML) {
        await addHistoryEntry('grammar', originalHTML, data.correctedContent, noteTitle, noteTitle);
        onContentChange(data.correctedContent, false);
        toast.success("Grammar corrected");
      } else {
        toast.success("No grammar errors found");
      }
    } catch (error) {
      console.error('Grammar check failed:', error);
      toast.error("Grammar check failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const [originalContentBackup, setOriginalContentBackup] = useState<{content: string, title: string} | null>(null);
  
  useEffect(() => {
    if (!originalContentBackup) {
      setOriginalContentBackup({ content: originalHTML, title: noteTitle });
    }
  }, []);

  const handleAIUndo = async () => {
    if (!originalContentBackup) {
      toast.error("Nothing to revert");
      return;
    }
    onContentChange(originalContentBackup.content);
    if (originalContentBackup.title && originalContentBackup.title !== noteTitle) {
      onTitleChange(originalContentBackup.title);
    }
    setOriginalContentBackup(null);
    toast.success("Reverted to original");
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

  return createPortal(
     <>
      {/* Floating AI button - only show on desktop, or on mobile when chat is hidden and NOT using bottom nav */}
      {(!showChatDialog || isChatHidden) && !isMobile && (
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || isProcessing}
              onClick={!isDropdownOpen ? (() => {
                setIsChatHidden(false);
                handleOpenChatDialog();
              }) : undefined}
              className="!fixed !z-[9999] h-12 w-12 rounded-full
                bg-accent/10 hover:bg-accent/20
                border-2 border-accent
                text-accent
                shadow-glow-sm hover:shadow-glow
                transition-all duration-250 ease-bounce-out
                hover:scale-[1.05] active:scale-[0.95]
                flex items-center justify-center p-0
                backdrop-blur-sm"
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
          if (!open) {
            setIsChatHidden(false);
            if (isMobile) {
              setIsAiChatOpen(false);
            }
          }
        }}
        onHide={() => setIsChatHidden(true)}
        content={content}
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