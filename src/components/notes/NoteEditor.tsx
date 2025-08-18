
import React, { useState, useEffect, useRef } from 'react';
import { useNotes, Note } from '@/contexts/NoteContext';
import DOMPurify from 'dompurify';
import { ImageUploadButton } from './ImageUploadButton';
import { FeaturedImage } from './FeaturedImage';
import { sanitizeContent, sanitizeForDisplay, sanitizeImageUrl, isValidImageUrl } from "@/lib/sanitization";
import { BlockHandle, BlockType } from './BlockHandle';
import { usePageLeave } from '@/hooks/usePageLeave';

interface NoteEditorProps {
  note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const [lastSavedContent, setLastSavedContent] = useState(note.content);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [handleTop, setHandleTop] = useState(0);
  const [showHandle, setShowHandle] = useState(false);
  const [currentBlockType, setCurrentBlockType] = useState<BlockType>('p');
  
  const isReadOnly = note.isSharedWithUser && note.userPermission === 'read';

  // Handle page leave - save with notification
  const handlePageLeave = () => {
    if (contentRef.current) {
      const content = contentRef.current.innerHTML;
      const sanitizedContent = sanitizeContent(content);
      if (sanitizedContent !== lastSavedContent) {
        updateNote(note.id, { content: sanitizedContent }, false); // Non-silent save on page leave
      }
    }
  };

  usePageLeave({ onPageLeave: handlePageLeave });
  
  // Apply iOS zoom prevention on mount
  useEffect(() => {
    // Ensure title and content have proper font size to prevent zoom
    if (titleRef.current && parseFloat(getComputedStyle(titleRef.current).fontSize) < 16) {
      titleRef.current.style.fontSize = '16px';
    }
    if (contentRef.current && parseFloat(getComputedStyle(contentRef.current).fontSize) < 16) {
      contentRef.current.style.fontSize = '16px';
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
      // Only update content if it's actually different to avoid removing event handlers
      const currentContent = contentRef.current.innerHTML;
      if (currentContent !== note.content) {
        // Sanitize content for display
        const sanitizedContent = sanitizeForDisplay(note.content);
        contentRef.current.innerHTML = sanitizedContent;
      }
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
          // Sanitize content before saving to database
          const sanitizedContent = sanitizeContent(content);
          updateNote(note.id, { content: sanitizedContent }, true); // Silent auto-save
          setLastSavedContent(sanitizedContent);
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

  // Handle image insertion at cursor position with validation
  const insertImageAtCursor = (imageUrl: string) => {
    if (!contentRef.current) return;

    try {
      // Validate and sanitize the image URL
      const { url: sanitizedUrl, alt } = sanitizeImageUrl(imageUrl, 'Uploaded image');
      
      const img = document.createElement('img');
      img.src = sanitizedUrl;
      img.alt = alt;
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
    } catch (error) {
      console.error('Failed to insert image:', error);
      // Could show a toast notification here
    }
  };

  // Handle paste events to strip formatting and normalize line breaks
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    
    // Normalize line breaks: allow single and double, but collapse 3+ to double
    const normalizedText = text
      .replace(/\r\n/g, '\n')  // Normalize Windows line endings
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ line breaks with double (paragraph break)
      .trim();
    
    // Get current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Delete current selection if any
    range.deleteContents();
    
    // Split by single line breaks and insert
    const lines = normalizedText.split('\n');
    
    lines.forEach((line, index) => {
      // Insert text node for each line (including empty ones)
      const textNode = document.createTextNode(line);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      
      // Add line break except for the last line
      if (index < lines.length - 1) {
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
      }
    });
    
    // Collapse range to end
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Trigger content change to save
    if (contentRef.current) {
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
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

  }, [note.id]);

  // Block handle positioning and block type detection
  useEffect(() => {
    if (isReadOnly) return;
    
    const updateHandle = () => {
      const editor = contentRef.current;
      if (!editor) {
        setShowHandle(false);
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowHandle(false);
        return;
      }

      const range = selection.getRangeAt(0);
      
      // Check if selection is within the editor
      if (!editor.contains(range.commonAncestorContainer)) {
        setShowHandle(false);
        return;
      }

      // Find the current line/block element
      let element = range.commonAncestorContainer;
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement!;
      }

      // Find the closest block element (div is the editor's main container)
      let blockElement = (element as Element).closest('h1, blockquote, p, div');
      
      // If we're in the main editor div, treat it as a paragraph
      if (blockElement === editor) {
        blockElement = element as Element;
      }

      if (!blockElement) {
        setShowHandle(false);
        return;
      }

      // Determine block type
      const tagName = blockElement.tagName.toLowerCase();
      if (tagName === 'h1') {
        setCurrentBlockType('h1');
      } else {
        setCurrentBlockType('p');
      }

      // Calculate absolute position on screen
      const blockRect = blockElement.getBoundingClientRect();
      const absoluteTop = blockRect.top;
      
      setHandleTop(absoluteTop);
      setShowHandle(true);
    };

    // Add event listeners
    const editor = contentRef.current;
    if (editor) {
      editor.addEventListener('focus', updateHandle);
      editor.addEventListener('input', updateHandle);
      editor.addEventListener('keyup', updateHandle);
      editor.addEventListener('click', updateHandle);
    }
    
    document.addEventListener('selectionchange', updateHandle);
    
    return () => {
      if (editor) {
        editor.removeEventListener('focus', updateHandle);
        editor.removeEventListener('input', updateHandle);
        editor.removeEventListener('keyup', updateHandle);
        editor.removeEventListener('click', updateHandle);
      }
      document.removeEventListener('selectionchange', updateHandle);
    };
  }, [isReadOnly]);

  const handleBlockTypeSelect = (type: BlockType) => {
    if (!contentRef.current) return;
    contentRef.current.focus();
    try {
      document.execCommand('formatBlock', false, type === 'p' ? 'p' : type);
    } catch (e) {
      // no-op
    }
    contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-24 relative overflow-visible">
      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => {
          if (isReadOnly) return;
          const newTitle = e.target.value;
          setTitle(newTitle);
          updateNote(note.id, { title: newTitle }, true); // Silent title update
        }}
        placeholder="Untitled Note"
        className={`w-full text-3xl font-serif font-medium mb-6 bg-transparent border-none outline-none px-0 focus:ring-0 focus:outline-none resize-none overflow-hidden ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
        readOnly={isReadOnly}
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
      
      {note.featured_image && (
        <FeaturedImage 
          imageUrl={note.featured_image} 
          alt={note.title}
          onDelete={() => updateNote(note.id, { featured_image: null }, true)}
        />
      )}
      
      <div
        ref={contentRef}
        contentEditable={!isReadOnly}
        className={`note-editor prose prose-sm md:prose-base max-w-none outline-none focus:outline-none min-h-[50vh] transition-none editor-anchor relative ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
        data-placeholder={isReadOnly ? "This note is read-only" : "Just start typing…"}
        aria-label="Note content"
        onPaste={isReadOnly ? undefined : handlePaste}
        onFocus={() => !isReadOnly && setShowHandle(true)}
      />
      
      {!isReadOnly && <ImageUploadButton onImageInsert={insertImageAtCursor} />}

      {!isReadOnly && (
        <BlockHandle
          top={handleTop}
          visible={showHandle}
          currentType={currentBlockType}
          onSelect={handleBlockTypeSelect}
        />
      )}
    </div>
  );
}
