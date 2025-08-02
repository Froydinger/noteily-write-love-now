
import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Quote, CheckSquare } from 'lucide-react';
import { CommandGroup, CommandItem } from '@/components/ui/command';

interface FormatMenuProps {
  position: { top: number; left: number };
  onFormatSelect: (command: string, value?: string) => void;
  onClose: () => void;
}

const FormatMenu = ({ position, onFormatSelect, onClose }: FormatMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const formatCommands = [
    { id: 'h1', name: 'Heading 1', execute: () => onFormatSelect('formatBlock', '<h1>') },
    { id: 'h2', name: 'Heading 2', execute: () => onFormatSelect('formatBlock', '<h2>') },
    { id: 'bold', name: 'Bold', icon: Bold, execute: () => onFormatSelect('bold') },
    { id: 'italic', name: 'Italic', icon: Italic, execute: () => onFormatSelect('italic') },
    { id: 'quote', name: 'Blockquote', icon: Quote, execute: () => onFormatSelect('formatBlock', '<blockquote>') },
    { id: 'checklist', name: 'Checklist', icon: CheckSquare, execute: () => onFormatSelect('insertChecklist') }
  ];

  return (
    <div 
      ref={menuRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 50,
      }}
      className="bg-background border rounded-lg shadow-lg w-48 overflow-hidden dark:border-neon-blue/40 dark:shadow-neon-blue/20"
    >
      <CommandGroup heading="Formatting" className="p-1">
        {formatCommands.map((command) => (
          <CommandItem
            key={command.id}
            onSelect={command.execute}
            className="flex items-center gap-2 cursor-pointer rounded-md py-1.5 px-2 text-sm dark:hover:bg-accent dark:hover:text-accent-foreground"
          >
            {command.icon && <command.icon size={16} className="dark:text-neon-blue" />}
            {!command.icon && (
              <span className="w-4 h-4 flex items-center justify-center font-bold dark:text-neon-blue">
                {command.id === 'h1' ? 'H1' : command.id === 'h2' ? 'H2' : ''}
              </span>
            )}
            <span>{command.name}</span>
          </CommandItem>
        ))}
      </CommandGroup>
    </div>
  );
};

export default FormatMenu;
