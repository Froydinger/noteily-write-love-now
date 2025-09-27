import React from 'react';
import { TextEnhancementMenu } from './TextEnhancementMenu';

interface SpellCheckButtonProps {
  content: string;
  originalHTML: string;
  onContentChange: (newContent: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  noteTitle: string;
  onTitleChange: (newTitle: string) => void;
  disabled?: boolean;
}

export function SpellCheckButton(props: SpellCheckButtonProps) {
  return <TextEnhancementMenu {...props} />;
}