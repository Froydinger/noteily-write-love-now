
import React, { useState, useEffect, useRef } from 'react';
import { useNotes, Note } from '@/contexts/NoteContext';
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from '@/components/ui/command';
import { Bold, Italic, Underline, ListOrdered, List, Quote } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface NoteEditorProps {
  note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState({ top: 0, left: 0 });
  const [selection, setSelection] = useState<Selection | null>(null);
  
  // Update title and content when note changes
  useEffect(() => {
    setTitle(note.title);
    if (contentRef.current) {
      contentRef.current.innerHTML = note.content;
    }
  }, [note.id, note.title, note.content]);

  // Update title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateNote(note.id, { title: newTitle });
  };

  // Handle content updates with debounce
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleContentChange = () => {
      if (contentRef.current) {
        const content = contentRef.current.innerHTML;
        
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          updateNote(note.id, { content });
        }, 500);
      }
    };

    const currentRef = contentRef.current;
    
    if (currentRef) {
      currentRef.addEventListener('input', handleContentChange);
    }
    
    return () => {
      clearTimeout(timeout);
      if (currentRef) {
        currentRef.removeEventListener('input', handleContentChange);
      }
    };
  }, [note.id, updateNote]);

  // Handle key press for / command
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '/' && !showFormatMenu) {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      
      setSelection(selection);
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setFormatMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      
      setShowFormatMenu(true);
    } else if (e.key === 'Escape' && showFormatMenu) {
      setShowFormatMenu(false);
    }
  };

  // Format commands - simplified with only the requested options
  const formatCommands = [
    { 
      id: 'h1', 
      name: 'Heading 1',
      icon: Bold,
      execute: () => execFormatCommand('formatBlock', '<h1>') 
    },
    { 
      id: 'h2', 
      name: 'Heading 2',
      icon: Bold,
      execute: () => execFormatCommand('formatBlock', '<h2>') 
    },
    { 
      id: 'bold', 
      name: 'Bold', 
      icon: Bold,
      execute: () => execFormatCommand('bold') 
    },
    { 
      id: 'italic', 
      name: 'Italic', 
      icon: Italic,
      execute: () => execFormatCommand('italic') 
    },
    { 
      id: 'quote', 
      name: 'Blockquote', 
      icon: Quote,
      execute: () => execFormatCommand('formatBlock', '<blockquote>') 
    }
  ];

  // Improved format command function with better selection handling
  const execFormatCommand = (command: string, value?: string) => {
    setShowFormatMenu(false);
    
    // Focus back on the editor
    if (contentRef.current) {
      contentRef.current.focus();
      
      // Restore selection if available
      if (selection) {
        const range = selection.getRangeAt(0);
        const newSelection = window.getSelection();
        if (newSelection) {
          newSelection.removeAllRanges();
          newSelection.addRange(range);
        }
      }
      
      // Execute the command
      document.execCommand(command, false, value);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled Note"
        className="w-full text-3xl font-serif font-medium mb-6 bg-transparent border-none outline-none px-0 focus:ring-0 dark:focus:ring-neon-blue"
        aria-label="Note title"
      />
      
      <div
        ref={contentRef}
        contentEditable
        className="note-editor prose prose-sm md:prose-base max-w-none focus:outline-none dark:focus:ring-neon-blue dark:prose-invert"
        data-placeholder="Start writing here... (or press '/' for formatting options)"
        aria-label="Note content"
        onKeyDown={handleKeyDown}
      />
      
      {showFormatMenu && (
        <div 
          style={{
            position: 'absolute',
            top: formatMenuPosition.top + 'px',
            left: formatMenuPosition.left + 'px',
            zIndex: 50,
          }}
          className="bg-background border rounded-md shadow-lg w-60 dark:border-neon-blue/40"
        >
          <Command>
            <CommandList>
              <CommandGroup heading="Formatting">
                {formatCommands.map((command) => (
                  <CommandItem
                    key={command.id}
                    onSelect={() => command.execute()}
                    className="flex items-center gap-2 cursor-pointer dark:hover:bg-accent dark:hover:text-accent-foreground"
                  >
                    {command.icon && <command.icon size={18} className="dark:text-neon-blue" />}
                    <span>{command.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
