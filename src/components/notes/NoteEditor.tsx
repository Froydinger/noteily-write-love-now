
import React, { useState, useEffect, useRef } from 'react';
import { useNotes, Note } from '@/contexts/NoteContext';
import DOMPurify from 'dompurify';
import { ImageUploadButton } from './ImageUploadButton';

interface NoteEditorProps {
  note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Simple keyboard detection and auto-scroll
  useEffect(() => {
    let keyboardIsOpen = false;
    
    const scrollActiveElementIntoView = () => {
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement === titleRef.current || activeElement === contentRef.current)) {
          // Position the element at the top of the visible area to stay above keyboard
          activeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
          
          // Add extra offset to ensure it's clearly above keyboard
          window.scrollBy(0, -100);
        }
      }, 200);
    };
    
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.screen.height;
      const keyboardHeight = screenHeight - viewportHeight;
      
      // Track keyboard state
      const wasKeyboardOpen = keyboardIsOpen;
      keyboardIsOpen = keyboardHeight > 200;
      
      // Only trigger scroll when keyboard first opens, not when it's already open
      if (keyboardIsOpen && !wasKeyboardOpen) {
        scrollActiveElementIntoView();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && keyboardIsOpen) {
        // Only prevent default for contentEditable, let textarea handle normally
        const target = e.target as HTMLElement;
        if (target === contentRef.current) {
          e.preventDefault();
          document.execCommand('insertHTML', false, '<br>');
        }
        
        // Then align after a short delay to show cursor above keyboard
        setTimeout(() => {
          scrollActiveElementIntoView();
        }, 50);
      }
    };

    // Add event listeners
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    if (titleRef.current) {
      titleRef.current.addEventListener('keydown', handleKeyDown);
    }
    
    if (contentRef.current) {
      contentRef.current.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      if (titleRef.current) {
        titleRef.current.removeEventListener('keydown', handleKeyDown);
      }
      if (contentRef.current) {
        contentRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Update title and content when note changes
  useEffect(() => {
    setTitle(note.title);
    if (contentRef.current) {
      // Sanitize content to prevent XSS attacks
      const sanitizedContent = DOMPurify.sanitize(note.content);
      contentRef.current.innerHTML = sanitizedContent;
    }
  }, [note.id]);


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

  // Handle image insertion at cursor position
  const insertImageAtCursor = (imageUrl: string) => {
    if (!contentRef.current) return;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = '50%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '1rem auto';
    img.style.borderRadius = '8px';
    img.className = 'note-image';
    img.setAttribute('data-image-id', Date.now().toString());

    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range && contentRef.current.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(img);
      
      // Move cursor after the image
      const newRange = document.createRange();
      newRange.setStartAfter(img);
      newRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    } else {
      // Fallback: append to end
      contentRef.current.appendChild(img);
    }

    // Trigger content change to save
    contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // Handle existing images in loaded content
  useEffect(() => {
    if (!contentRef.current) return;
    
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.hasAttribute('data-image-id')) {
        img.setAttribute('data-image-id', Date.now().toString());
        img.className = 'note-image';
      }
    });
  }, [note.content]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-96 animate-fade-in">
      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => {
          const newTitle = e.target.value;
          setTitle(newTitle);
          updateNote(note.id, { title: newTitle });
        }}
        placeholder="Untitled Note"
        className="w-full text-3xl font-serif font-medium mb-6 bg-transparent border-none outline-none px-0 focus:ring-0 dark:focus:ring-neon-blue resize-none overflow-hidden"
        style={{ 
          minHeight: 'auto',
          height: 'auto'
        }}
        rows={1}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
        aria-label="Note title"
      />
      
      <div
        ref={contentRef}
        contentEditable
        className="note-editor prose prose-sm md:prose-base max-w-none focus:outline-none dark:focus:ring-neon-blue dark:prose-invert min-h-[50vh] max-h-none h-auto"
        data-placeholder="Just start typing…"
        aria-label="Note content"
        style={{ maxHeight: 'none', height: 'auto' }}
      />
      
      <ImageUploadButton onImageInsert={insertImageAtCursor} />
    </div>
  );
}
