
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

    // Add click handler for showing resize button
    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Blur the contentEditable to hide keyboard
      if (contentRef.current) {
        contentRef.current.blur();
      }
      
      // Show resize button after brief delay
      setTimeout(() => {
        showResizeButton(img);
      }, 50);
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

  // Show resize button when image is clicked
  const showResizeButton = (img: HTMLImageElement) => {
    // Remove any existing resize buttons
    document.querySelectorAll('.image-resize-btn').forEach(el => el.remove());

    // Get current size to determine next size
    const currentWidth = img.style.width || '50%';
    const sizes = ['30%', '50%', '70%'];
    const currentIndex = sizes.indexOf(currentWidth);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];

    // Create resize button
    const resizeBtn = document.createElement('button');
    resizeBtn.className = 'image-resize-btn';
    resizeBtn.innerHTML = '↔';
    resizeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      background: white;
      color: black;
      border: 2px solid #e5e5e5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: all 0.2s ease;
    `;

    // Create wrapper if it doesn't exist
    let wrapper = img.parentElement;
    if (!wrapper || !wrapper.classList.contains('image-wrapper')) {
      wrapper = document.createElement('div');
      wrapper.className = 'image-wrapper';
      wrapper.style.cssText = `
        position: relative;
        display: inline-block;
        margin: 1rem auto;
        width: fit-content;
      `;
      
      img.parentNode?.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    }

    wrapper.appendChild(resizeBtn);

    // Handle resize button click
    resizeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Add bounce animation class
      img.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      
      // Change size
      img.style.width = nextSize;
      img.style.height = 'auto';

      // Remove transition after animation
      setTimeout(() => {
        img.style.transition = '';
      }, 300);

      // Save changes
      contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Hide button after click
      setTimeout(() => {
        resizeBtn.remove();
      }, 1000);
    });

    // Hide button when clicking elsewhere
    const hideButton = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!wrapper?.contains(target)) {
        resizeBtn.remove();
        document.removeEventListener('click', hideButton);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', hideButton);
    }, 100);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (resizeBtn.parentNode) {
        resizeBtn.remove();
        document.removeEventListener('click', hideButton);
      }
    }, 3000);
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
        
        // Add click handler for showing resize button
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Blur the contentEditable to hide keyboard
          if (contentRef.current) {
            contentRef.current.blur();
          }
          
          // Show resize button after brief delay
          setTimeout(() => {
            showResizeButton(img as HTMLImageElement);
          }, 50);
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
