
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
  const [dynamicPadding, setDynamicPadding] = useState('pb-96');
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic padding based on viewport and content
  useEffect(() => {
    const updatePadding = () => {
      if (!containerRef.current) return;
      
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const initialHeight = window.screen.height || window.innerHeight;
      const keyboardHeight = initialHeight - viewportHeight;
      
      // If keyboard is open (significant height difference)
      if (keyboardHeight > 200) {
        // Add extra padding for keyboard
        const extraPadding = Math.max(keyboardHeight, 400);
        setDynamicPadding(`pb-[${extraPadding}px]`);
      } else {
        // Default large padding for scrolling space
        setDynamicPadding('pb-96');
      }
    };

    updatePadding();
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updatePadding);
      return () => window.visualViewport?.removeEventListener('resize', updatePadding);
    } else {
      window.addEventListener('resize', updatePadding);
      return () => window.removeEventListener('resize', updatePadding);
    }
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


  // Handle content updates with debounce and auto-scroll
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

    const scrollToCursor = () => {
      if (!contentRef.current) return;
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // If cursor is below viewport or close to bottom, scroll down
      const viewportHeight = window.innerHeight;
      const keyboardThreshold = viewportHeight * 0.6; // Assume keyboard takes up 40% of screen
      
      if (rect.bottom > keyboardThreshold) {
        // Scroll the cursor position into view with some padding
        const scrollTarget = rect.bottom - keyboardThreshold + 100;
        window.scrollBy({
          top: scrollTarget,
          behavior: 'smooth'
        });
      }
    };

    const handleInput = () => {
      handleContentChange();
      // Delay scroll to allow content to render
      setTimeout(scrollToCursor, 50);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Extra delay for Enter key to handle new line creation
        setTimeout(scrollToCursor, 100);
      }
    };

    const currentRef = contentRef.current;
    
    if (currentRef) {
      currentRef.addEventListener('input', handleInput);
      currentRef.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      clearTimeout(timeout);
      if (currentRef) {
        currentRef.removeEventListener('input', handleInput);
        currentRef.removeEventListener('keydown', handleKeyDown);
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
    <div ref={containerRef} className={`w-full max-w-3xl mx-auto px-4 pt-8 animate-fade-in ${dynamicPadding}`}>
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
        className="note-editor prose prose-sm md:prose-base max-w-none focus:outline-none dark:focus:ring-neon-blue dark:prose-invert min-h-[50vh]"
        data-placeholder="Just start typing…"
        aria-label="Note content"
      />
      
      <ImageUploadButton onImageInsert={insertImageAtCursor} />
    </div>
  );
}
