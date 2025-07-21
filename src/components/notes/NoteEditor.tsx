
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

    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range && contentRef.current.contains(range.commonAncestorContainer)) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '1rem 0';
      img.style.borderRadius = '8px';
      img.style.cursor = 'move';
      img.draggable = true;
      img.className = 'note-image resizable';
      
      // Add resize handles
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      wrapper.style.margin = '1rem 0';
      wrapper.className = 'image-wrapper';
      
      wrapper.appendChild(img);
      
      // Add resize handle
      const resizeHandle = document.createElement('div');
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.bottom = '0';
      resizeHandle.style.right = '0';
      resizeHandle.style.width = '16px';
      resizeHandle.style.height = '16px';
      resizeHandle.style.backgroundColor = 'var(--primary)';
      resizeHandle.style.cursor = 'se-resize';
      resizeHandle.style.borderRadius = '2px';
      resizeHandle.style.opacity = '0';
      resizeHandle.style.transition = 'opacity 0.2s';
      resizeHandle.className = 'resize-handle';
      
      wrapper.appendChild(resizeHandle);
      
      // Show/hide resize handle on hover
      wrapper.addEventListener('mouseenter', () => {
        resizeHandle.style.opacity = '1';
      });
      wrapper.addEventListener('mouseleave', () => {
        resizeHandle.style.opacity = '0';
      });
      
      // Handle resizing
      let isResizing = false;
      let startX = 0;
      let startWidth = 0;
      
      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startWidth = img.offsetWidth;
        
        const handleMouseMove = (e: MouseEvent) => {
          if (!isResizing) return;
          const width = startWidth + (e.clientX - startX);
          const maxWidth = contentRef.current?.offsetWidth || 800;
          const newWidth = Math.min(Math.max(width, 100), maxWidth);
          img.style.width = newWidth + 'px';
          img.style.maxWidth = newWidth + 'px';
        };
        
        const handleMouseUp = () => {
          isResizing = false;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          // Trigger content change to save
          if (contentRef.current) {
            contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
          }
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      });
      
      // Handle drag and drop
      img.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/html', wrapper.outerHTML);
        e.dataTransfer!.effectAllowed = 'move';
        wrapper.style.opacity = '0.5';
      });
      
      img.addEventListener('dragend', () => {
        wrapper.style.opacity = '1';
      });
      
      range.deleteContents();
      range.insertNode(wrapper);
      
      // Move cursor after the image
      const newRange = document.createRange();
      newRange.setStartAfter(wrapper);
      newRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(newRange);
      
      // Trigger content change to save
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Fallback: append to end if no selection
      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '1rem 0';
      img.style.borderRadius = '8px';
      img.className = 'note-image';
      
      contentRef.current.appendChild(img);
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  // Handle drag and drop for reordering images
  useEffect(() => {
    const currentRef = contentRef.current;
    if (!currentRef) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const html = e.dataTransfer?.getData('text/html');
      if (html && html.includes('note-image')) {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        
        if (range && currentRef.contains(range.commonAncestorContainer)) {
          // Remove the original image (it will be re-added at the new position)
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const wrapper = tempDiv.firstChild as HTMLElement;
          
          range.deleteContents();
          range.insertNode(wrapper);
          
          // Trigger content change to save
          currentRef.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };

    currentRef.addEventListener('dragover', handleDragOver);
    currentRef.addEventListener('drop', handleDrop);

    return () => {
      currentRef.removeEventListener('dragover', handleDragOver);
      currentRef.removeEventListener('drop', handleDrop);
    };
  }, []);

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
