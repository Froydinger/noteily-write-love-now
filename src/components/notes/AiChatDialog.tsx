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
import { Brain, Send, Undo2, History, X, Eye, EyeOff } from 'lucide-react';
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
}

export function AiChatDialog({
  open,
  onOpenChange,
  content,
  originalHTML,
  noteTitle,
  onContentChange,
  onTitleChange,
  history,
  onRevertToVersion,
  onAddHistoryEntry
}: AiChatDialogProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [autoHide, setAutoHide] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize chat with welcome message
  useEffect(() => {
    if (open && chatMessages.length === 0) {
      setChatMessages([{
        id: 'welcome',
        type: 'system',
        content: 'Hi! I can help you improve your writing. Use the quick actions below or tell me what you\'d like me to do with your text.',
        timestamp: new Date()
      }]);
    }
  }, [open, chatMessages.length]);

  // Auto-hide functionality - minimize dialog when AI responds
  useEffect(() => {
    if (autoHide && chatMessages.length > 2 && !isProcessing) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      const secondLastMessage = chatMessages[chatMessages.length - 2];
      
      // Only auto-hide if last message is AI response and second-last was user message
      if (lastMessage.type === 'ai' && secondLastMessage.type === 'user') {
        const timer = setTimeout(() => {
          setIsMinimized(true);
        }, 2000); // 2 second delay
        
        return () => clearTimeout(timer);
      }
    }
  }, [chatMessages, autoHide, isProcessing]);

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
          action: 'spell'
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== content) {
        await onAddHistoryEntry('spell', content, data.correctedContent, noteTitle, noteTitle);
        onContentChange(data.correctedContent);
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'I found and corrected some spelling errors in your text.',
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
          action: 'grammar'
        }
      });

      if (error) throw error;

      if (data.correctedContent && data.correctedContent !== content) {
        await onAddHistoryEntry('grammar', content, data.correctedContent, noteTitle, noteTitle);
        onContentChange(data.correctedContent);
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'I found and corrected some grammar issues in your text.',
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
          instructions: instruction
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
        
        onContentChange(response.data.correctedContent);
        
        if (response.data.newTitle && response.data.newTitle !== noteTitle) {
          onTitleChange(response.data.newTitle);
        }
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'I\'ve rewritten your text according to your instructions. The changes have been applied to your note.',
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
    
    const instruction = inputValue.trim();
    setInputValue('');
    await handleRewrite(instruction);
  };

  const handleUndo = async () => {
    if (history.length === 0) {
      toast({
        title: "Nothing to undo",
        description: "No previous AI changes available to restore.",
        variant: "destructive",
      });
      return;
    }

    const lastEntry = history[0];
    const revertData = await onRevertToVersion(lastEntry);
    
    onContentChange(revertData.content);
    if (revertData.title && revertData.title !== noteTitle) {
      onTitleChange(revertData.title);
    }
    
    const undoMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: 'Reverted to previous version.',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, undoMessage]);
    
    toast({
      title: "Changes undone",
      description: "Content has been reverted to previous version.",
    });
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
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent 
        className={`
          ${isMobile 
            ? `fixed bottom-4 right-4 top-auto left-auto w-[90vw] max-w-sm ${isMinimized ? 'h-16' : 'h-[70vh]'} m-0 translate-x-0 translate-y-0 rounded-lg border shadow-lg` 
            : 'sm:max-w-2xl h-[80vh]'
          } 
          flex flex-col p-0 transition-all duration-300 z-50 bg-background [&>button]:hidden
        `}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {!isMinimized && "AI Writing Assistant"}
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
                >
                  {isMinimized ? "↑" : "↓"}
                </Button>
              )}
              {!isMinimized && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUndo}
                    disabled={history.length === 0 || isProcessing}
                    title="Undo last AI change"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    disabled={isProcessing}
                    title="Toggle history view"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
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
                  {chatMessages.map((message) => (
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
                        <span className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
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

              {/* Auto-hide toggle and Quick Actions */}
              <div className="px-6 py-3 border-t bg-muted/30">
                {/* Auto-hide toggle */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-muted-foreground">Quick Actions:</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAutoHide(!autoHide)}
                    className="text-xs flex items-center gap-1"
                    title={autoHide ? "Turn off auto-hide" : "Turn on auto-hide"}
                  >
                    {autoHide ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    Auto Hide {autoHide ? 'On' : 'Off'}
                  </Button>
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
                    className="flex-1"
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

            {/* History Sidebar */}
          {showHistory && (
            <div className="w-80 border-l bg-muted/30 flex flex-col">
              <div className="px-4 py-3 border-b">
                <h3 className="font-medium text-sm">Change History</h3>
              </div>
              <ScrollArea className="flex-1 px-4 py-3">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No changes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium capitalize">{entry.action_type}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevertToHistoryVersion(entry)}
                            className="text-xs h-6"
                          >
                            Revert
                          </Button>
                        </div>
                        {entry.instruction && (
                          <div className="text-xs bg-muted px-2 py-1 rounded mb-2">
                            {entry.instruction}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}