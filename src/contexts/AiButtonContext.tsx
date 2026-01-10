import React, { createContext, useContext, useState, useCallback } from 'react';

export interface AiButtonProps {
  content: string;
  originalHTML: string;
  noteTitle: string;
  noteId: string;
  onContentChange: (newContent: string, isSelectionReplacement?: boolean) => void;
  onTitleChange: (newTitle: string) => void;
  disabled?: boolean;
}

interface AiButtonContextType {
  isAiButtonVisible: boolean;
  aiButtonProps: AiButtonProps | null;
  registerAiButton: (props: AiButtonProps) => void;
  unregisterAiButton: () => void;
  openAiChat: () => void;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
}

const AiButtonContext = createContext<AiButtonContextType | undefined>(undefined);

export function AiButtonProvider({ children }: { children: React.ReactNode }) {
  const [aiButtonProps, setAiButtonProps] = useState<AiButtonProps | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  const registerAiButton = useCallback((props: AiButtonProps) => {
    setAiButtonProps(props);
  }, []);

  const unregisterAiButton = useCallback(() => {
    setAiButtonProps(null);
    setIsAiChatOpen(false);
  }, []);

  const openAiChat = useCallback(() => {
    setIsAiChatOpen(true);
  }, []);

  return (
    <AiButtonContext.Provider
      value={{
        isAiButtonVisible: aiButtonProps !== null,
        aiButtonProps,
        registerAiButton,
        unregisterAiButton,
        openAiChat,
        isAiChatOpen,
        setIsAiChatOpen,
      }}
    >
      {children}
    </AiButtonContext.Provider>
  );
}

export function useAiButton() {
  const context = useContext(AiButtonContext);
  if (context === undefined) {
    throw new Error('useAiButton must be used within an AiButtonProvider');
  }
  return context;
}
