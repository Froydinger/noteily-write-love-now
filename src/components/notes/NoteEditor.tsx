
import React, { useState, useEffect, useRef } from 'react';
import { useNotes, Note } from '@/contexts/NoteContext';
import DOMPurify from 'dompurify';
import { ImageUploadButton } from './ImageUploadButton';
import { FeaturedImage } from './FeaturedImage';
import { sanitizeContent, sanitizeForDisplay, sanitizeImageUrl, isValidImageUrl } from "@/lib/sanitization";

interface NoteEditorProps {
  note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const isReadOnly = note.isSharedWithUser && note.userPermission === 'read';
  
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
        // Preserve existing checklist containers before sanitizing
        const existingChecklists = Array.from(contentRef.current.querySelectorAll('.checklist-container'));
        
        // Sanitize content for display (includes checklist restoration)
        const sanitizedContent = sanitizeForDisplay(note.content);
        contentRef.current.innerHTML = sanitizedContent;
        
        // Restore event handlers for any existing checklists
        restoreChecklistHandlers();
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
          // For checklists, we need to preserve the current state
          const sanitizedContent = sanitizeContent(content, { preserveChecklists: true });
          
          // Only update if the content actually changed to avoid unnecessary re-renders
          if (sanitizedContent !== note.content) {
            updateNote(note.id, { content: sanitizedContent });
          }
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

    // Don't automatically remove checklist items - they should persist
    // Only handle this on initial load when the note ID changes
  }, [note.id]);


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

    // Create checklist container that's completely separate from contentEditable
    const checklistContainer = document.createElement('div');
    checklistContainer.className = 'checklist-container';
    checklistContainer.contentEditable = 'false'; // Disable contentEditable on container
    checklistContainer.style.margin = '1rem 0';
    checklistContainer.setAttribute('data-checklist-id', Date.now().toString());

    // Create first checklist item
    const checklistItem = createChecklistItem('');
    checklistContainer.appendChild(checklistItem);

    if (range && contentRef.current.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(checklistContainer);
    } else {
      contentRef.current.appendChild(checklistContainer);
    }

    // Focus on the first input
    const firstInput = checklistItem.querySelector('.checklist-input') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }

    // Trigger content change to save
    contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // Create a single checklist item
  const createChecklistItem = (text: string = '', checked: boolean = false) => {
    const item = document.createElement('div');
    item.className = 'checklist-item';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '12px';
    item.style.marginBottom = '8px';
    item.style.padding = '4px 0';

    // Checkbox
    const checkbox = document.createElement('button');
    checkbox.className = 'checklist-checkbox';
    checkbox.type = 'button';
    checkbox.style.width = '18px';
    checkbox.style.height = '18px';
    checkbox.style.borderRadius = '50%';
    checkbox.style.border = '2px solid hsl(var(--border))';
    checkbox.style.background = checked ? 'hsl(var(--primary))' : 'transparent';
    checkbox.style.color = checked ? 'hsl(var(--primary-foreground))' : 'transparent';
    checkbox.style.cursor = 'pointer';
    checkbox.style.flexShrink = '0';
    checkbox.style.display = 'flex';
    checkbox.style.alignItems = 'center';
    checkbox.style.justifyContent = 'center';
    checkbox.style.fontSize = '10px';
    checkbox.style.fontWeight = '600';
    checkbox.innerHTML = checked ? '✓' : '';

    // Text input
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'checklist-input';
    textInput.value = text;
    textInput.placeholder = 'List item';
    textInput.style.flex = '1';
    textInput.style.border = 'none';
    textInput.style.outline = 'none';
    textInput.style.background = 'transparent';
    textInput.style.fontSize = 'inherit';
    textInput.style.fontFamily = 'inherit';
    textInput.style.color = checked ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))';
    textInput.style.textDecoration = checked ? 'line-through' : 'none';

    // Event handlers
    checkbox.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isChecked = checkbox.style.background.includes('var(--primary)');
      
      if (isChecked) {
        // Uncheck
        checkbox.style.background = 'transparent';
        checkbox.style.color = 'transparent';
        checkbox.innerHTML = '';
        textInput.style.textDecoration = 'none';
        textInput.style.color = 'hsl(var(--foreground))';
      } else {
        // Check
        checkbox.style.background = 'hsl(var(--primary))';
        checkbox.style.color = 'hsl(var(--primary-foreground))';
        checkbox.innerHTML = '✓';
        textInput.style.textDecoration = 'line-through';
        textInput.style.color = 'hsl(var(--muted-foreground))';
      }

      // Save changes
      if (contentRef.current) {
        contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    textInput.addEventListener('keydown', (e) => {
      const container = item.closest('.checklist-container');
      if (!container) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        
        if (!textInput.value.trim()) {
          // Exit checklist mode on empty item
          exitChecklistMode(container, item);
        } else {
          // Create new checklist item
          createNewChecklistItem(container, item);
        }
      } else if (e.key === 'Backspace' && !textInput.value && textInput.selectionStart === 0) {
        e.preventDefault();
        e.stopPropagation();
        
        removeChecklistItem(container, item);
      }
    });

    textInput.addEventListener('input', () => {
      // Save changes
      if (contentRef.current) {
        contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    item.appendChild(checkbox);
    item.appendChild(textInput);

    return item;
  };

  // Helper functions for checklist operations
  const createNewChecklistItem = (container: Element, currentItem: Element) => {
    const newItem = createChecklistItem('');
    if (currentItem.nextSibling) {
      container.insertBefore(newItem, currentItem.nextSibling);
    } else {
      container.appendChild(newItem);
    }
    
    const newInput = newItem.querySelector('.checklist-input') as HTMLInputElement;
    if (newInput) {
      newInput.focus();
    }

    // Save changes
    if (contentRef.current) {
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const exitChecklistMode = (container: Element, currentItem: Element) => {
    // Create a new paragraph after the checklist
    const newParagraph = document.createElement('div');
    newParagraph.innerHTML = '<br>';
    newParagraph.contentEditable = 'true';
    
    if (container.parentNode) {
      container.parentNode.insertBefore(newParagraph, container.nextSibling);
    }
    
    // Remove empty item or whole container
    if (container.children.length === 1) {
      container.remove();
    } else {
      currentItem.remove();
    }
    
    // Focus the new paragraph
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(newParagraph, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Save changes
    if (contentRef.current) {
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const removeChecklistItem = (container: Element, currentItem: Element) => {
    if (container.children.length === 1) {
      return; // Don't remove the last item
    }
    
    // Focus previous item if exists
    const prevItem = currentItem.previousElementSibling;
    if (prevItem) {
      const prevInput = prevItem.querySelector('.checklist-input') as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
      }
    }
    
    currentItem.remove();

    // Save changes
    if (contentRef.current) {
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  // Restore event handlers for existing checklists after content load
  const restoreChecklistHandlers = () => {
    if (!contentRef.current) return;
    
    const checklistContainers = contentRef.current.querySelectorAll('.checklist-container');
    checklistContainers.forEach(container => {
      const items = container.querySelectorAll('.checklist-item');
      items.forEach(item => {
        const checkbox = item.querySelector('.checklist-checkbox') as HTMLButtonElement;
        const textInput = item.querySelector('.checklist-input') as HTMLInputElement;
        
        if (checkbox && textInput) {
          // Re-attach event handlers
          checkbox.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isChecked = checkbox.style.background.includes('var(--primary)');
            
            if (isChecked) {
              checkbox.style.background = 'transparent';
              checkbox.style.color = 'transparent';
              checkbox.innerHTML = '';
              textInput.style.textDecoration = 'none';
              textInput.style.color = 'hsl(var(--foreground))';
            } else {
              checkbox.style.background = 'hsl(var(--primary))';
              checkbox.style.color = 'hsl(var(--primary-foreground))';
              checkbox.innerHTML = '✓';
              textInput.style.textDecoration = 'line-through';
              textInput.style.color = 'hsl(var(--muted-foreground))';
            }

            if (contentRef.current) {
              contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
            }
          };

          textInput.onkeydown = (e) => {
            const container = item.closest('.checklist-container');
            if (!container) return;

            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              
              if (!textInput.value.trim()) {
                exitChecklistMode(container, item);
              } else {
                createNewChecklistItem(container, item);
              }
            } else if (e.key === 'Backspace' && !textInput.value && textInput.selectionStart === 0) {
              e.preventDefault();
              e.stopPropagation();
              
              removeChecklistItem(container, item);
            }
          };

          textInput.oninput = () => {
            if (contentRef.current) {
              contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
            }
          };
        }
      });
    });
  };


  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-96 animate-fade-in">
      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => {
          if (isReadOnly) return;
          const newTitle = e.target.value;
          setTitle(newTitle);
          updateNote(note.id, { title: newTitle });
        }}
        placeholder="Untitled Note"
        className={`w-full text-3xl font-serif font-medium mb-6 bg-transparent border-none outline-none px-0 focus:ring-0 dark:focus:ring-neon-blue resize-none overflow-hidden ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
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
          onDelete={() => updateNote(note.id, { featured_image: null })}
        />
      )}
      
      <div
        ref={contentRef}
        contentEditable={!isReadOnly}
        className={`note-editor prose prose-sm md:prose-base max-w-none focus:outline-none dark:focus:ring-neon-blue dark:prose-invert min-h-[50vh] ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
        data-placeholder={isReadOnly ? "This note is read-only" : "Just start typing…"}
        aria-label="Note content"
        onPaste={isReadOnly ? undefined : handlePaste}
      />
      
      {!isReadOnly && <ImageUploadButton onImageInsert={insertImageAtCursor} />}
    </div>
  );
}
