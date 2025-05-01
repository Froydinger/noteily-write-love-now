import React, { useState, useEffect, useRef } from 'react';
import { useNotes, Note } from '@/contexts/NoteContext';
import { 
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from '@/components/ui/command';
import { Bold, Italic, Underline, ListOrdered, ListUnordered } from 'lucide-react';

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
  
  // Initial content setting
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = note.content;
    }
  }, [note.id]);

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
        top: rect.bottom,
        left: rect.left
      });
      
      setShowFormatMenu(true);
    } else if (e.key === 'Escape' && showFormatMenu) {
      setShowFormatMenu(false);
    }
  };

  // Format commands
  const formatCommands = [
    { 
      id: 'bold', 
      name: 'Bold', 
      icon: Bold,
      execute: () => document.execCommand('bold', false) 
    },
    { 
      id: 'italic', 
      name: 'Italic', 
      icon: Italic,
      execute: () => document.execCommand('italic', false) 
    },
    { 
      id: 'underline', 
      name: 'Underline', 
      icon: Underline,
      execute: () => document.execCommand('underline', false) 
    },
    { 
      id: 'h1', 
      name: 'Heading 1', 
      execute: () => document.execCommand('formatBlock', false, '<h1>') 
    },
    { 
      id: 'h2', 
      name: 'Heading 2', 
      execute: () => document.execCommand('formatBlock', false, '<h2>') 
    },
    { 
      id: 'h3', 
      name: 'Heading 3', 
      execute: () => document.execCommand('formatBlock', false, '<h3>') 
    },
    { 
      id: 'quote', 
      name: 'Blockquote', 
      execute: () => document.execCommand('formatBlock', false, '<blockquote>') 
    },
    { 
      id: 'ul', 
      name: 'Bullet List', 
      icon: ListUnordered,
      execute: () => document.execCommand('insertUnorderedList', false) 
    },
    { 
      id: 'ol', 
      name: 'Numbered List', 
      icon: ListOrdered,
      execute: () => document.execCommand('insertOrderedList', false) 
    },
    { 
      id: 'divider', 
      name: 'Divider', 
      execute: () => {
        document.execCommand('insertHTML', false, '<hr>');
      }
    }
  ];

  const handleFormatCommand = (command: typeof formatCommands[0]) => {
    setShowFormatMenu(false);
    
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
    command.execute();
    
    // Focus back on the editor
    if (contentRef.current) {
      contentRef.current.focus();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled Note"
        className="w-full text-3xl font-serif font-medium mb-6 bg-transparent border-none outline-none px-0 focus:ring-0"
        aria-label="Note title"
      />
      
      <div
        ref={contentRef}
        contentEditable
        className="note-editor prose prose-sm md:prose-base max-w-none focus:outline-none"
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
          className="bg-background border rounded-md shadow-lg w-60"
        >
          <Command>
            <CommandInput placeholder="Search formatting..." autoFocus />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Formatting">
                {formatCommands.map((command) => (
                  <CommandItem
                    key={command.id}
                    onSelect={() => handleFormatCommand(command)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {command.icon && React.createElement(command.icon, { size: 18 })}
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
