
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

    // Add click handler for showing controls
    img.addEventListener('click', (e) => {
      e.preventDefault();
      showImageControls(img);
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

  // Show image controls when image is clicked
  const showImageControls = (img: HTMLImageElement) => {
    // Remove any existing controls
    document.querySelectorAll('.image-control').forEach(el => el.remove());

    const rect = img.getBoundingClientRect();
    const editorRect = contentRef.current?.getBoundingClientRect();
    
    if (!editorRect) return;

    // Create move handle (top-left)
    const moveHandle = document.createElement('div');
    moveHandle.className = 'image-control move-handle';
    moveHandle.innerHTML = '⋮⋮';
    moveHandle.style.cssText = `
      position: absolute;
      top: ${rect.top - editorRect.top - 12}px;
      left: ${rect.left - editorRect.left - 12}px;
      width: 24px;
      height: 24px;
      background: hsl(var(--primary));
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: move;
      font-size: 12px;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    // Create resize handle (bottom-right)
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'image-control resize-handle';
    resizeHandle.innerHTML = '↘';
    resizeHandle.style.cssText = `
      position: absolute;
      top: ${rect.bottom - editorRect.top - 12}px;
      left: ${rect.right - editorRect.left - 12}px;
      width: 24px;
      height: 24px;
      background: hsl(var(--primary));
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: se-resize;
      font-size: 12px;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    contentRef.current?.appendChild(moveHandle);
    contentRef.current?.appendChild(resizeHandle);

    // Handle moving
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let imgStartX = 0;
    let imgStartY = 0;

    moveHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      imgStartX = img.offsetLeft;
      imgStartY = img.offsetTop;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        
        // For now, we'll just change the margin to simulate movement
        const currentMarginTop = parseInt(img.style.marginTop) || 16;
        const currentMarginLeft = parseInt(img.style.marginLeft) || 0;
        
        img.style.marginTop = Math.max(0, currentMarginTop + deltaY * 0.1) + 'px';
        img.style.marginLeft = Math.max(-50, Math.min(50, currentMarginLeft + deltaX * 0.1)) + 'px';
        
        updateControlPositions();
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

    // Handle resizing
    let isResizing = false;
    let resizeStartX = 0;
    let imgStartWidth = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizing = true;
      resizeStartX = e.clientX;
      imgStartWidth = img.offsetWidth;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - resizeStartX;
        const newWidth = imgStartWidth + deltaX;
        const maxWidth = contentRef.current?.offsetWidth || 800;
        const minWidth = 100;
        
        const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
        const percentage = (constrainedWidth / maxWidth) * 100;
        
        img.style.width = percentage + '%';
        updateControlPositions();
      };

      const handleMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    // Update control positions
    const updateControlPositions = () => {
      const newRect = img.getBoundingClientRect();
      moveHandle.style.top = `${newRect.top - editorRect.top - 12}px`;
      moveHandle.style.left = `${newRect.left - editorRect.left - 12}px`;
      resizeHandle.style.top = `${newRect.bottom - editorRect.top - 12}px`;
      resizeHandle.style.left = `${newRect.right - editorRect.left - 12}px`;
    };

    // Hide controls when clicking elsewhere
    const hideControls = (e: MouseEvent) => {
      if (!moveHandle.contains(e.target as Node) && 
          !resizeHandle.contains(e.target as Node) && 
          !img.contains(e.target as Node)) {
        document.querySelectorAll('.image-control').forEach(el => el.remove());
        document.removeEventListener('click', hideControls);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', hideControls);
    }, 100);
  };

  // Clean up image controls when component unmounts
  useEffect(() => {
    return () => {
      document.querySelectorAll('.image-control').forEach(el => el.remove());
    };
  }, []);

  // Handle existing images in loaded content
  useEffect(() => {
    if (!contentRef.current) return;
    
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.hasAttribute('data-image-id')) {
        img.setAttribute('data-image-id', Date.now().toString());
        img.className = 'note-image';
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
          e.preventDefault();
          showImageControls(img as HTMLImageElement);
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
