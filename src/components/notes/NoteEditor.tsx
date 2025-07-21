
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
    img.style.cursor = 'pointer';
    img.className = 'note-image';
    img.setAttribute('data-image-id', Date.now().toString());

    // Add touch/click handlers for direct image interaction
    let touchStartTime = 0;
    let isLongPress = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    
    // Touch start
    img.addEventListener('touchstart', (e) => {
      touchStartTime = Date.now();
      isLongPress = false;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startWidth = img.offsetWidth;
      
      // Blur to prevent keyboard
      if (contentRef.current) {
        contentRef.current.blur();
      }
    }, { passive: false });
    
    // Touch move - handle resizing
    img.addEventListener('touchmove', (e) => {
      e.preventDefault();
      
      if (Date.now() - touchStartTime > 200) { // Long press detected
        isLongPress = true;
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const newWidth = startWidth + deltaX;
        const maxWidth = contentRef.current?.offsetWidth || 800;
        const minWidth = 100;
        
        const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
        const percentage = Math.min(Math.max((constrainedWidth / maxWidth) * 100, 10), 90);
        
        img.style.width = percentage + '%';
        img.style.height = 'auto';
      }
    }, { passive: false });
    
    // Touch end
    img.addEventListener('touchend', (e) => {
      if (isLongPress) {
        contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
      }
      isLongPress = false;
      isDragging = false;
    });
    
    // Mouse events for desktop
    img.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = img.offsetWidth;
      
      // Blur to prevent focus
      if (contentRef.current) {
        contentRef.current.blur();
      }
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;
        const maxWidth = contentRef.current?.offsetWidth || 800;
        const minWidth = 100;
        
        const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
        const percentage = Math.min(Math.max((constrainedWidth / maxWidth) * 100, 10), 90);
        
        img.style.width = percentage + '%';
        img.style.height = 'auto';
      };
      
      const handleMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

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
        img.style.cursor = 'pointer';
        
        // Add the same touch/click handlers for existing images
        let touchStartTime = 0;
        let isLongPress = false;
        let isDragging = false;
        let startX = 0;
        let startWidth = 0;
        
        // Touch events
        img.addEventListener('touchstart', (e) => {
          touchStartTime = Date.now();
          isLongPress = false;
          const touch = e.touches[0];
          startX = touch.clientX;
          startWidth = (img as HTMLImageElement).offsetWidth;
          
          if (contentRef.current) {
            contentRef.current.blur();
          }
        }, { passive: false });
        
        img.addEventListener('touchmove', (e) => {
          e.preventDefault();
          
          if (Date.now() - touchStartTime > 200) {
            isLongPress = true;
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const newWidth = startWidth + deltaX;
            const maxWidth = contentRef.current?.offsetWidth || 800;
            const minWidth = 100;
            
            const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
            const percentage = Math.min(Math.max((constrainedWidth / maxWidth) * 100, 10), 90);
            
            (img as HTMLImageElement).style.width = percentage + '%';
            (img as HTMLImageElement).style.height = 'auto';
          }
        }, { passive: false });
        
        img.addEventListener('touchend', (e) => {
          if (isLongPress) {
            contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
          }
          isLongPress = false;
          isDragging = false;
        });
        
        // Mouse events
        img.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          isDragging = true;
          startX = e.clientX;
          startWidth = (img as HTMLImageElement).offsetWidth;
          
          if (contentRef.current) {
            contentRef.current.blur();
          }
          
          const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;
            const maxWidth = contentRef.current?.offsetWidth || 800;
            const minWidth = 100;
            
            const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
            const percentage = Math.min(Math.max((constrainedWidth / maxWidth) * 100, 10), 90);
            
            (img as HTMLImageElement).style.width = percentage + '%';
            (img as HTMLImageElement).style.height = 'auto';
          };
          
          const handleMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
      }
    });
  }, [note.content]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-fade-in">
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
