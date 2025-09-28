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
import { Brain, Send, History, X, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AiHistoryEntry } from '@/hooks/useAiHistory';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  instruction?: string;
  actionType?: 'spell' | 'grammar' | 'rewrite';
  timestamp: Date;
}

interface AiChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHide?: () => void;
  content: string;
  originalHTML: string;
  noteTitle: string;
  onContentChange: (newContent: string) => void;
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
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedTextRange, setSelectedTextRange] = useState<{start: number, end: number} | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Check if working with selected text
  const isSelectedText = content.length < originalHTML.length;

  // Function to inject changed text back into the original content
  const injectChangedText = (originalContent: string, selectedText: string, newText: string): string => {
    if (!isSelectedText || !selectedText.trim()) {
      return newText; // If no selection, replace all content
    }

    // Clean the selected text for more reliable matching
    const cleanSelectedText = selectedText.trim();
    const cleanOriginalContent = originalContent;
    
    // Find the first occurrence of the selected text
    const selectedTextIndex = cleanOriginalContent.indexOf(cleanSelectedText);
    
    if (selectedTextIndex !== -1) {
      // Make sure we're replacing the exact selection by checking context
      const beforeSelection = cleanOriginalContent.substring(0, selectedTextIndex);
      const afterSelection = cleanOriginalContent.substring(selectedTextIndex + cleanSelectedText.length);
      
      // Only replace if this looks like the right match (no duplicate replacements)
      if (!beforeSelection.includes(newText) && !afterSelection.includes(newText)) {
        return beforeSelection + newText + afterSelection;
      }
    }
    
    // Fallback: if we can't safely inject, warn and replace only if it's clearly a full rewrite
    console.warn('Could not safely inject selected text, falling back to full content replacement');
    return newText;
  };

  // Initialize chat with welcome message and reset states when opening
  useEffect(() => {
    if (open) {
      console.log('Dialog opening - current state:', { isMinimized, hasTextSelected });
      // Only reset minimized state if dialog was completely closed before
      setHasUserInteracted(false); // Reset interaction flag
      
      // Calculate text selection range if working with selected text
      if (isSelectedText) {
        const fullText = originalHTML.replace(/<[^>]*>/g, ''); // Strip HTML for text comparison
        const selectedIndex = fullText.indexOf(content);
        if (selectedIndex !== -1) {
          setSelectedTextRange({
            start: selectedIndex,
            end: selectedIndex + content.length
          });
        }
      } else {
        setSelectedTextRange(null);
      }
      
      if (chatMessages.length === 0) {
        const welcomeMessage = isSelectedText 
          ? 'Hi! I can help you improve your selected text. Use the quick actions below or tell me what you\'d like me to do.'
          : 'Hi! I can help you improve your writing. Use the quick actions below or tell me what you\'d like me to do with your text.';
        setChatMessages([{
          id: 'welcome',
          type: 'system',
          content: welcomeMessage,
          timestamp: new Date()
        }]);
      }
    }
  }, [open, isSelectedText, content, originalHTML]);

  // Removed auto-hide functionality completely


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
    { label: 'Professional', instruction: 'Make this more professional and formal' },
    { label: 'Casual', instruction: 'Make this more casual and friendly' },
    { label: 'Expand', instruction: 'Expand this text with more details and examples' },
    { label: 'Shorten', instruction: 'Make this shorter and more concise' },
    { label: 'Happier', instruction: 'Make this more upbeat, positive and happier' },
    { label: 'Formal', instruction: 'Make this more formal and business-appropriate' },
  ];

  const handleQuickAction = async (instruction: string, actionLabel: string) => {
    console.log('Quick action triggered:', actionLabel);
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

    console.log('Spell check triggered');
    setHasUserInteracted(true);
    setIsProcessing(true);
    
    // Add user message
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
          content: content,
          action: 'spell',
          originalHTML: originalHTML,
          isSelectedText: isSelectedText
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== content) {
        await onAddHistoryEntry('spell', content, data.correctedContent, noteTitle, noteTitle);
        
        console.log('Spell check - injecting:', { 
          isSelectedText, 
          originalLength: originalHTML.length, 
          selectedLength: content.length,
          newContentLength: data.correctedContent.length 
        });
        
        // For spell check, inject corrected text properly
        const plainOriginal = originalHTML.replace(/<[^>]*>/g, '');
        const finalContent = injectChangedText(plainOriginal, content, data.correctedContent);
        onContentChange(finalContent);
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'I found and corrected some spelling errors in your text.',
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
          content: 'No spelling errors found. Your text looks good!',
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
        content: 'Sorry, there was an error checking your spelling. Please try again.',
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

    console.log('Grammar check triggered');
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
          content: content,
          action: 'grammar',
          originalHTML: originalHTML,
          isSelectedText: isSelectedText
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== content) {
        await onAddHistoryEntry('grammar', content, data.correctedContent, noteTitle, noteTitle);
        
        // For grammar check, inject corrected text properly
        const plainOriginal = originalHTML.replace(/<[^>]*>/g, '');
        const finalContent = injectChangedText(plainOriginal, content, data.correctedContent);
        onContentChange(finalContent);
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'I found and corrected some grammar issues in your text.',
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
          content: 'No grammar errors found. Your text looks good!',
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
        content: 'Sorry, there was an error checking your grammar. Please try again.',
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
          content: content,
          title: noteTitle,
          action: 'rewrite',
          instructions: instruction,
          originalHTML: originalHTML,
          isSelectedText: isSelectedText
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Function failed');
      }

      if (response.data && response.data.correctedContent) {
        await onAddHistoryEntry(
          'rewrite',
          content,
          response.data.correctedContent,
          noteTitle,
          response.data.newTitle || noteTitle,
          instruction
        );
        
        console.log('Rewrite - injecting:', { 
          isSelectedText, 
          originalLength: originalHTML.length, 
          selectedLength: content.length,
          newContentLength: response.data.correctedContent.length,
          hasHTML: response.data.correctedContent.includes('<')
        });
        
        // For rewrite operations, use the AI's HTML content properly
        if (isSelectedText) {
          // For selected text, inject the HTML content into the original HTML
          const plainOriginal = originalHTML.replace(/<[^>]*>/g, '');
          const finalContent = injectChangedText(plainOriginal, content, response.data.correctedContent);
          onContentChange(finalContent);
        } else {
          // For full content rewrite, use the AI's HTML directly
          onContentChange(response.data.correctedContent);
        }
        
        if (response.data.newTitle && response.data.newTitle !== noteTitle) {
          onTitleChange(response.data.newTitle);
        }
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'I\'ve rewritten your text according to your instructions. The changes have been applied to your note.',
          actionType: 'rewrite',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: "Text rewritten",
          description: "Your content has been rewritten according to your instructions.",
        });
      } else {
        throw new Error('No rewritten content received');
      }
    } catch (error: any) {
      console.error('Rewrite error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, there was an error rewriting your text. Please try again.',
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
    
    console.log('Send message triggered');
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
      content: `Reverted to version from ${new Date(entry.created_at).toLocaleString()}.`,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, revertMessage]);
    
    toast({
      title: "Reverted",
      description: "Content has been reverted to selected version.",
    });
  };

  return (
    <>
      {/* Mobile: Use Dialog for full screen */}
      {isMobile ? (
        <Dialog 
          open={open} 
          onOpenChange={() => {
            // Completely prevent automatic closing - only allow manual close via X button
            console.log('Dialog onOpenChange triggered but prevented automatic closing');
          }}
          modal={false}
        >
          <DialogContent
            className={`
              fixed bottom-4 right-4 top-auto left-auto w-[90vw] max-w-sm m-0 translate-x-0 translate-y-0 rounded-lg border shadow-lg
              ${isMinimized ? 'h-16' : 'h-[70vh]'}
              flex flex-col p-0 transition-all duration-300 z-50 bg-background
              [&>button]:hidden
            `}
          >
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {!isMinimized && (
                <span>NoteBot</span>
              )}
              {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Expand chat" : "Minimize chat"}
                  className={`transition-all duration-300 mr-2 ${
                    hasTextSelected ? 'ring-2 ring-blue-400 ring-offset-1 shadow-blue-400/50' : ''
                  }`}
                  style={{
                    animation: hasTextSelected ? 'glowBlue 2s ease-in-out infinite alternate' : 'none'
                  }}
                >
                  {isMinimized ? "↑" : "↓"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Close button clicked - closing dialog');
                  onOpenChange(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <div className="flex-1 flex min-h-0">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4">
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.type === 'ai'
                            ? 'bg-muted'
                            : 'bg-accent text-accent-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          
                          {/* Add rollback button for AI messages that correspond to history entries */}
                          {message.type === 'ai' && message.actionType && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Find the corresponding history entry and revert
                                const correspondingEntry = history.find(entry => 
                                  entry.action_type === message.actionType &&
                                  Math.abs(new Date(entry.created_at).getTime() - message.timestamp.getTime()) < 10000 // within 10 seconds
                                );
                                if (correspondingEntry) {
                                  handleRevertToHistoryVersion(correspondingEntry);
                                }
                              }}
                              className="text-xs h-6 px-2 ml-2 opacity-60 hover:opacity-100"
                              title="Undo this change"
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent"></div>
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Status text instead of auto-hide toggle */}
              <div className="px-6 py-3 border-t bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-muted-foreground">Quick Actions:</div>
                  <div 
                    className={`text-xs text-muted-foreground px-2 py-1 bg-background/50 rounded transition-all duration-300 ${
                      hasTextSelected ? 'ring-1 ring-blue-400 shadow-blue-400/30' : ''
                    }`}
                    style={{
                      animation: hasTextSelected ? 'glowBlue 2s ease-in-out infinite alternate' : 'none'
                    }}
                  >
                    {hasTextSelected ? "Text is selected" : "Editing whole page"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSpellCheck}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    Spelling
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGrammarCheck}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    Grammar
                  </Button>
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.instruction, action.label)}
                      disabled={isProcessing}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2 mt-3">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Tell me how to improve your text..."
                    disabled={isProcessing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-background text-foreground border-border placeholder:text-muted-foreground focus:ring-ring focus:border-ring"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
      ) : (
        /* Desktop: Use fixed positioned div instead of modal */
        open && (
          <div className="fixed bottom-4 right-16 z-[9998] w-96 max-h-[70vh] bg-background border border-border rounded-lg shadow-xl flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  <span className="font-semibold">NoteBot</span>
                  {isProcessing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onHide?.()}
                    title="Hide chat"
                    className="transition-all duration-300"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('Close button clicked');
                      onOpenChange(false);
                    }}
                    title="Close chat"
                    className="transition-all duration-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : message.type === 'system'
                        ? 'bg-muted text-muted-foreground border border-border'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.type === 'ai' && message.actionType && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (history.length > 0) {
                                const lastEntry = history[0];
                                await handleRevertToHistoryVersion(lastEntry);
                              }
                            }}
                            disabled={history.length === 0}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Undo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent"></div>
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Status and Input */}
            <div className="px-6 py-3 border-t bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-muted-foreground">Quick Actions:</div>
                <div 
                  className={`text-xs text-muted-foreground px-2 py-1 bg-background/50 rounded transition-all duration-300 ${
                    hasTextSelected ? 'ring-1 ring-blue-400 shadow-blue-400/30' : ''
                  }`}
                  style={{
                    animation: hasTextSelected ? 'glowBlue 2s ease-in-out infinite alternate' : 'none'
                  }}
                >
                  {hasTextSelected ? "Text is selected" : "Editing whole page"}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSpellCheck}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  Spelling
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGrammarCheck}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  Grammar
                </Button>
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.instruction, action.label)}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2 mt-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Tell me how to improve your text..."
                  disabled={isProcessing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 bg-background text-foreground border-border placeholder:text-muted-foreground focus:ring-ring focus:border-ring"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )
      )}
    </>
  );
}