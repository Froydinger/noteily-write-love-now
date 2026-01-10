import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Coffee,
  Maximize2,
  Minimize2,
  Smile,
  GraduationCap,
  SpellCheck,
  Type,
  RotateCcw,
  Wand2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AiHistoryEntry } from '@/hooks/useAiHistory';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  instruction?: string;
  actionType?: 'spell' | 'grammar' | 'rewrite' | 'restore';
  timestamp: Date;
}

interface AiChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHide?: () => void;
  content: string;
  originalHTML: string;
  noteTitle: string;
  onContentChange: (newContent: string, isSelectionReplacement?: boolean) => void;
  onTitleChange: (newTitle: string) => void;
  history: AiHistoryEntry[];
  onRevertToVersion: (entry: AiHistoryEntry) => Promise<{ content: string; title?: string }>;
  onAddHistoryEntry: (
    actionType: 'spell' | 'grammar' | 'rewrite',
    originalContent: string,
    newContent: string,
    originalTitle?: string,
    newTitle?: string,
    instruction?: string
  ) => Promise<void>;
  hasTextSelected?: boolean;
}

export function AiChatDialog({
  open,
  onOpenChange,
  onHide,
  content,
  originalHTML,
  noteTitle,
  onContentChange,
  onTitleChange,
  history,
  onRevertToVersion,
  onAddHistoryEntry,
  hasTextSelected = false
}: AiChatDialogProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalContentBackup, setOriginalContentBackup] = useState<{content: string, title: string} | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize chat with welcome message and reset states when opening
  useEffect(() => {
    if (open) {
      setHasUserInteracted(false);

      if (!originalContentBackup) {
        setOriginalContentBackup({
          content: content,
          title: noteTitle
        });
      }

      if (chatMessages.length === 0) {
        setChatMessages([{
          id: 'welcome',
          type: 'system',
          content: 'How would you like me to enhance your writing?',
          timestamp: new Date()
        }]);
      }
    }
  }, [open, content, originalHTML]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

  const quickActions = [
    { label: 'Professional', instruction: 'Make this more professional and formal', icon: Briefcase, color: 'from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border-blue-500/20' },
    { label: 'Casual', instruction: 'Make this more casual and friendly', icon: Coffee, color: 'from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border-amber-500/20' },
    { label: 'Expand', instruction: 'Expand this text with more details and examples', icon: Maximize2, color: 'from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 border-green-500/20' },
    { label: 'Shorten', instruction: 'Make this shorter and more concise', icon: Minimize2, color: 'from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 border-purple-500/20' },
    { label: 'Happier', instruction: 'Make this more upbeat, positive and happier', icon: Smile, color: 'from-pink-500/20 to-pink-600/10 hover:from-pink-500/30 hover:to-pink-600/20 border-pink-500/20' },
    { label: 'Formal', instruction: 'Make this more formal and business-appropriate', icon: GraduationCap, color: 'from-slate-500/20 to-slate-600/10 hover:from-slate-500/30 hover:to-slate-600/20 border-slate-500/20' },
  ];

  const handleQuickAction = async (instruction: string, actionLabel: string) => {
    setHasUserInteracted(true);
    await handleRewrite(instruction, actionLabel);
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

    setHasUserInteracted(true);
    setIsProcessing(true);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: 'Check spelling',
      actionType: 'spell',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('spell-check', {
        body: {
          content: originalHTML,
          action: 'spell',
          originalHTML: originalHTML,
          isSelectedText: false
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== originalHTML) {
        await onAddHistoryEntry('spell', originalHTML, data.correctedContent, noteTitle, noteTitle);
        onContentChange(data.correctedContent, false);

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Fixed spelling errors in your text.',
          actionType: 'spell',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);

        toast({
          title: "Spelling corrected",
          description: "Fixed spelling errors in your note.",
        });
      } else {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'No spelling errors found!',
          actionType: 'spell',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Spell check failed:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, there was an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);

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

    setHasUserInteracted(true);
    setIsProcessing(true);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: 'Check grammar',
      actionType: 'grammar',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('spell-check', {
        body: {
          content: originalHTML,
          action: 'grammar',
          originalHTML: originalHTML,
          isSelectedText: false
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== originalHTML) {
        await onAddHistoryEntry('grammar', originalHTML, data.correctedContent, noteTitle, noteTitle);
        onContentChange(data.correctedContent, false);

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Fixed grammar issues in your text.',
          actionType: 'grammar',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);

        toast({
          title: "Grammar corrected",
          description: "Fixed grammar issues in your note.",
        });
      } else {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'No grammar issues found!',
          actionType: 'grammar',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Grammar check failed:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, there was an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Grammar check failed",
        description: "There was an error checking your grammar.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRewrite = async (instruction: string, actionLabel?: string) => {
    if (!content.trim()) {
      toast({
        title: "No text to rewrite",
        description: "Please write some text first.",
        variant: "destructive",
      });
      return;
    }

    if (!instruction.trim()) {
      toast({
        title: "No instructions provided",
        description: "Please provide instructions for how to rewrite the text.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: actionLabel || instruction,
      instruction,
      actionType: 'rewrite',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      const response = await supabase.functions.invoke('spell-check', {
        body: {
          content: originalHTML,
          title: noteTitle,
          action: 'rewrite',
          instructions: instruction,
          originalHTML: originalHTML,
          isSelectedText: false
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Function failed');
      }

      if (response.data && response.data.correctedContent) {
        await onAddHistoryEntry(
          'rewrite',
          originalHTML,
          response.data.correctedContent,
          noteTitle,
          response.data.newTitle || noteTitle,
          instruction
        );

        onContentChange(response.data.correctedContent, false);

        if (response.data.newTitle && response.data.newTitle !== noteTitle) {
          onTitleChange(response.data.newTitle);
        }

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Done! Your text has been rewritten.',
          actionType: 'rewrite',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);

        toast({
          title: "Text rewritten",
          description: "Your content has been updated.",
        });
      } else {
        throw new Error('No rewritten content received');
      }
    } catch (error: any) {
      console.error('Rewrite error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, there was an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Rewrite failed",
        description: error.message || "There was an error rewriting your text.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    setHasUserInteracted(true);
    const instruction = inputValue.trim();
    setInputValue('');
    await handleRewrite(instruction);
  };

  const handleRevertToHistoryVersion = async (entry: AiHistoryEntry) => {
    const revertData = await onRevertToVersion(entry);
    onContentChange(revertData.content);
    if (revertData.title && revertData.title !== noteTitle) {
      onTitleChange(revertData.title);
    }

    const revertMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: 'Reverted to previous version.',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, revertMessage]);

    toast({
      title: "Reverted",
      description: "Content has been reverted.",
    });
  };

  const renderContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/20">
              <Wand2 className="h-5 w-5 text-accent-foreground" />
            </div>
            {isProcessing && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Writer</h3>
            <p className="text-xs text-muted-foreground">Enhance your writing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-9 w-9 rounded-xl hover:bg-secondary/80"
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 rounded-xl hover:bg-secondary/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-5 py-4">
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                      message.type === 'user'
                        ? 'bg-accent text-accent-foreground rounded-br-md'
                        : message.type === 'system'
                        ? 'bg-secondary/50 text-foreground border border-border/50'
                        : 'bg-card text-foreground border border-border/50 rounded-bl-md'
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.type === 'ai' && message.actionType && history.length > 0 && (
                      <button
                        onClick={() => {
                          const correspondingEntry = history.find(entry =>
                            entry.action_type === message.actionType &&
                            Math.abs(new Date(entry.created_at).getTime() - message.timestamp.getTime()) < 10000
                          );
                          if (correspondingEntry) {
                            handleRevertToHistoryVersion(correspondingEntry);
                          }
                        }}
                        className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-muted-foreground">Writing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions & Input */}
          <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
            {/* Correction Actions */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleSpellCheck}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 hover:from-cyan-500/30 hover:to-cyan-600/20 border border-cyan-500/20 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SpellCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Spelling</span>
                </button>
                <button
                  onClick={handleGrammarCheck}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500/20 to-indigo-600/10 hover:from-indigo-500/30 hover:to-indigo-600/20 border border-indigo-500/20 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Type className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Grammar</span>
                </button>
              </div>
            </div>

            {/* Rewrite Actions Grid */}
            <div className="px-5 pb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Rewrite as...</p>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.instruction, action.label)}
                    disabled={isProcessing}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br border text-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]",
                      action.color
                    )}
                  >
                    <action.icon className="h-4 w-4 opacity-80" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="px-5 pb-5 pt-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Or describe how to rewrite..."
                    disabled={isProcessing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="pr-12 h-12 rounded-xl bg-background border-border/50 focus:border-accent/50 focus:ring-accent/20 text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing}
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Dialog
          open={open}
          onOpenChange={() => {}}
          modal={false}
        >
          <DialogContent
            className={cn(
              "fixed bottom-4 left-4 right-4 z-[9999] m-0 rounded-2xl border border-border/50 shadow-2xl",
              "flex flex-col p-0 transition-all duration-300 bg-background/95 backdrop-blur-xl",
              "[&>button]:hidden",
              isMinimized ? 'h-[72px]' : 'h-[75vh]'
            )}
            style={{
              transform: 'none',
              top: 'auto',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100dvh - 32px)'
            }}
          >
            {renderContent()}
          </DialogContent>
        </Dialog>
      ) : (
        open && (
          <div
            className={cn(
              "fixed bottom-4 right-4 z-[9998] w-[400px] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col transition-all duration-300",
              isMinimized ? 'h-[72px]' : 'h-[600px]'
            )}
            style={{
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100dvh - 32px)'
            }}
          >
            {renderContent()}
          </div>
        )
      )}
    </>
  );
}
