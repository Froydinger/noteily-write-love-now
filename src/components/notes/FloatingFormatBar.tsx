import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Heading1, Type, Bold, Italic } from 'lucide-react';

export type FormatType = 'p' | 'h1' | 'bold' | 'italic';

interface FloatingFormatBarProps {
  visible: boolean;
  onFormat: (type: FormatType) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

export const FloatingFormatBar: React.FC<FloatingFormatBarProps> = ({
  visible,
  onFormat,
  editorRef
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [currentFormats, setCurrentFormats] = useState<Set<FormatType>>(new Set());
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !editorRef.current) return;

    const updatePosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();

      if (rects.length === 0) return;

      // Get the first rect (where selection starts)
      const rect = rects[0];
      const editorRect = editorRef.current?.getBoundingClientRect();

      if (!editorRect) return;

      // Calculate position above the selection
      const top = rect.top - editorRect.top - 50; // 50px above selection
      const left = rect.left - editorRect.left + (rect.width / 2);

      setPosition({ top, left });

      // Detect current formatting
      const formats = new Set<FormatType>();

      // Check if we're in an H1
      let element = range.commonAncestorContainer;
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement!;
      }

      const h1 = (element as Element).closest('h1');
      if (h1) {
        formats.add('h1');
      } else {
        formats.add('p');
      }

      // Check for bold
      const bold = (element as Element).closest('strong, b');
      if (bold) formats.add('bold');

      // Check for italic
      const italic = (element as Element).closest('em, i');
      if (italic) formats.add('italic');

      setCurrentFormats(formats);
    };

    updatePosition();

    // Update position on scroll or resize
    const handleUpdate = () => updatePosition();
    window.addEventListener('resize', handleUpdate);
    document.addEventListener('selectionchange', handleUpdate);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      document.removeEventListener('selectionchange', handleUpdate);
    };
  }, [visible, editorRef]);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      className="absolute z-50 bg-background border rounded-lg shadow-lg p-1 flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <Button
        variant={currentFormats.has('p') ? 'default' : 'ghost'}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onFormat('p')}
        title="Paragraph"
      >
        <Type className="h-4 w-4" />
      </Button>

      <Button
        variant={currentFormats.has('h1') ? 'default' : 'ghost'}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onFormat('h1')}
        title="Title"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <div className="w-px bg-border mx-1" />

      <Button
        variant={currentFormats.has('bold') ? 'default' : 'ghost'}
        size="sm"
        className="h-8 w-8 p-0 font-bold"
        onClick={() => onFormat('bold')}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant={currentFormats.has('italic') ? 'default' : 'ghost'}
        size="sm"
        className="h-8 w-8 p-0 italic"
        onClick={() => onFormat('italic')}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
    </div>
  );
};
