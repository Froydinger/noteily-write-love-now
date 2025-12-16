import React from 'react';

export type FormatType = 'p' | 'h1' | 'bold' | 'italic';

interface FloatingFormatBarProps {
  visible: boolean;
  onFormat: (type: FormatType) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

// Floating format bar has been disabled - formatting features removed
export const FloatingFormatBar: React.FC<FloatingFormatBarProps> = () => {
  return null;
};
