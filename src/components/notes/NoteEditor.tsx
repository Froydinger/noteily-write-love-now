
import React, { useState, useEffect, useRef } from 'react';
import { useNotes, Note } from '@/contexts/NoteContext';
import DOMPurify from 'dompurify';
import { ImageUploadButton } from './ImageUploadButton';
import { FeaturedImage } from './FeaturedImage';

interface NoteEditorProps {
  note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
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

    // Handle existing checklist items
    const checklistItems = contentRef.current.querySelectorAll('.checklist-item');
    checklistItems.forEach((item) => {
      const checkbox = item.querySelector('.checklist-checkbox') as HTMLElement;
      const textSpan = item.querySelector('.checklist-text') as HTMLElement;
      
      if (checkbox && textSpan) {
        // Re-attach event listeners
        setupChecklistItemEvents(item as HTMLElement, checkbox, textSpan);
      }
    });
  }, [note.content]);

  // Setup checklist item event listeners
  const setupChecklistItemEvents = (item: HTMLElement, checkbox: HTMLElement, textSpan: HTMLElement) => {
    // Handle checkbox click
    checkbox.addEventListener('click', () => {
      const isChecked = checkbox.style.backgroundColor === 'hsl(var(--primary))';
      
      if (isChecked) {
        // Uncheck
        checkbox.style.backgroundColor = '';
        checkbox.style.borderColor = 'hsl(var(--border))';
        checkbox.innerHTML = '';
        textSpan.style.textDecoration = '';
        textSpan.style.color = '';
      } else {
        // Check
        checkbox.style.backgroundColor = 'hsl(var(--primary))';
        checkbox.style.borderColor = 'hsl(var(--primary))';
        checkbox.innerHTML = '✓';
        checkbox.style.color = 'hsl(var(--primary-foreground))';
        checkbox.style.fontSize = '10px';
        checkbox.style.display = 'flex';
        checkbox.style.alignItems = 'center';
        checkbox.style.justifyContent = 'center';
        textSpan.style.textDecoration = 'line-through';
        textSpan.style.color = 'hsl(var(--muted-foreground))';
      }

      // Trigger content change to save
      if (contentRef.current) {
        contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Handle Enter key to create new checklist item
    textSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const container = item.closest('.checklist-container');
        if (container) {
          const newItem = createChecklistItem('');
          container.insertBefore(newItem, item.nextSibling);
          const newTextInput = newItem.querySelector('.checklist-text') as HTMLElement;
          newTextInput?.focus();
        }
      } else if (e.key === 'Backspace' && textSpan.textContent === '') {
        e.preventDefault();
        const container = item.closest('.checklist-container');
        if (container && container.children.length > 1) {
          // Focus previous item if exists
          const prevItem = item.previousElementSibling;
          if (prevItem) {
            const prevTextInput = prevItem.querySelector('.checklist-text') as HTMLElement;
            prevTextInput?.focus();
            // Move cursor to end
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(prevTextInput);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
          item.remove();
          
          // Trigger content change to save
          if (contentRef.current) {
            contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    });
  };

  // Handle checklist insertion
  useEffect(() => {
    const handleInsertChecklist = () => {
      insertChecklistAtCursor();
    };

    document.addEventListener('insertChecklist', handleInsertChecklist);
    return () => {
      document.removeEventListener('insertChecklist', handleInsertChecklist);
    };
  }, []);

  // Insert checklist at cursor position
  const insertChecklistAtCursor = () => {
    if (!contentRef.current) return;

    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range && contentRef.current.contains(range.commonAncestorContainer)) {
      // Create checklist container
      const checklistContainer = document.createElement('div');
      checklistContainer.className = 'checklist-container';
      checklistContainer.style.margin = '1rem 0';

      // Create first checklist item
      const checklistItem = createChecklistItem('');
      checklistContainer.appendChild(checklistItem);

      range.deleteContents();
      range.insertNode(checklistContainer);
      
      // Focus on the text input of the first item
      const textInput = checklistItem.querySelector('.checklist-text') as HTMLElement;
      if (textInput) {
        textInput.focus();
        const newRange = document.createRange();
        newRange.selectNodeContents(textInput);
        newRange.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(newRange);
      }
    } else {
      // Fallback: append to end
      const checklistContainer = document.createElement('div');
      checklistContainer.className = 'checklist-container';
      checklistContainer.style.margin = '1rem 0';

      const checklistItem = createChecklistItem('');
      checklistContainer.appendChild(checklistItem);
      contentRef.current.appendChild(checklistContainer);
    }

    // Trigger content change to save
    contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // Create a single checklist item
  const createChecklistItem = (text: string = '', checked: boolean = false) => {
    const item = document.createElement('div');
    item.className = 'checklist-item';
    item.style.display = 'flex';
    item.style.alignItems = 'flex-start';
    item.style.gap = '0.5rem';
    item.style.marginBottom = '0.25rem';
    item.style.padding = '0.25rem 0';

    const checkbox = document.createElement('div');
    checkbox.className = 'checklist-checkbox';
    checkbox.style.width = '16px';
    checkbox.style.height = '16px';
    checkbox.style.borderRadius = '50%';
    checkbox.style.border = '2px solid hsl(var(--border))';
    checkbox.style.cursor = 'pointer';
    checkbox.style.flexShrink = '0';
    checkbox.style.marginTop = '2px';
    checkbox.style.transition = 'all 0.2s ease';

    if (checked) {
      checkbox.style.backgroundColor = 'hsl(var(--primary))';
      checkbox.style.borderColor = 'hsl(var(--primary))';
      checkbox.innerHTML = '✓';
      checkbox.style.color = 'hsl(var(--primary-foreground))';
      checkbox.style.fontSize = '10px';
      checkbox.style.display = 'flex';
      checkbox.style.alignItems = 'center';
      checkbox.style.justifyContent = 'center';
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'checklist-text';
    textSpan.contentEditable = 'true';
    textSpan.style.flex = '1';
    textSpan.style.outline = 'none';
    textSpan.style.minHeight = '1.2em';
    textSpan.textContent = text;

    if (checked) {
      textSpan.style.textDecoration = 'line-through';
      textSpan.style.color = 'hsl(var(--muted-foreground))';
    }

    // Handle checkbox click
    checkbox.addEventListener('click', () => {
      const isChecked = checkbox.style.backgroundColor === 'hsl(var(--primary))';
      
      if (isChecked) {
        // Uncheck
        checkbox.style.backgroundColor = '';
        checkbox.style.borderColor = 'hsl(var(--border))';
        checkbox.innerHTML = '';
        textSpan.style.textDecoration = '';
        textSpan.style.color = '';
      } else {
        // Check
        checkbox.style.backgroundColor = 'hsl(var(--primary))';
        checkbox.style.borderColor = 'hsl(var(--primary))';
        checkbox.innerHTML = '✓';
        checkbox.style.color = 'hsl(var(--primary-foreground))';
        checkbox.style.fontSize = '10px';
        checkbox.style.display = 'flex';
        checkbox.style.alignItems = 'center';
        checkbox.style.justifyContent = 'center';
        textSpan.style.textDecoration = 'line-through';
        textSpan.style.color = 'hsl(var(--muted-foreground))';
      }

      // Trigger content change to save
      if (contentRef.current) {
        contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Handle Enter key to create new checklist item
    textSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const container = item.closest('.checklist-container');
        if (container) {
          const newItem = createChecklistItem('');
          container.insertBefore(newItem, item.nextSibling);
          const newTextInput = newItem.querySelector('.checklist-text') as HTMLElement;
          newTextInput?.focus();
        }
      } else if (e.key === 'Backspace' && textSpan.textContent === '') {
        e.preventDefault();
        const container = item.closest('.checklist-container');
        if (container && container.children.length > 1) {
          // Focus previous item if exists
          const prevItem = item.previousElementSibling;
          if (prevItem) {
            const prevTextInput = prevItem.querySelector('.checklist-text') as HTMLElement;
            prevTextInput?.focus();
            // Move cursor to end
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(prevTextInput);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
          item.remove();
          
          // Trigger content change to save
          if (contentRef.current) {
            contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    });

    item.appendChild(checkbox);
    item.appendChild(textSpan);

    return item;
  };

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
      
      {note.featured_image && (
        <FeaturedImage 
          imageUrl={note.featured_image} 
          alt={note.title}
          onDelete={() => updateNote(note.id, { featured_image: null })}
        />
      )}
      
      <div
        ref={contentRef}
        contentEditable
        className="note-editor prose prose-sm md:prose-base max-w-none focus:outline-none dark:focus:ring-neon-blue dark:prose-invert min-h-[50vh]"
        data-placeholder="Just start typing…"
        aria-label="Note content"
        onPaste={handlePaste}
      />
      
      <ImageUploadButton onImageInsert={insertImageAtCursor} />
    </div>
  );
}
