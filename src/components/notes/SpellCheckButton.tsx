import React from 'react';
import { TextEnhancementMenu } from './TextEnhancementMenu';

interface SpellCheckButtonProps {
  content: string;
  originalHTML: string;
  onContentChange: (newContent: string) => void;
  noteTitle: string;
  onTitleChange: (newTitle: string) => void;
  disabled?: boolean;
  noteId: string;
}

export function SpellCheckButton(props: SpellCheckButtonProps) {
  return <TextEnhancementMenu {...props} />;
}
