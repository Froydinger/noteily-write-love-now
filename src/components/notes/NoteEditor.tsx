import React, { useRef, useEffect, useState } from 'react';
import { Note } from '@/contexts/NoteContext';
import { FeaturedImage } from './FeaturedImage';
import { ImageUploadButton } from './ImageUploadButton';
import { sanitizeImageUrl, sanitizeContent, sanitizeForDisplay } from '@/lib/sanitization';

interface NoteEditorProps {
  note: Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  isReadOnly?: boolean;
}

export function NoteEditor({ note, updateNote, isReadOnly = false }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-resize title textarea
  useEffect(() => {
    const titleElement = titleRef.current;
    if (titleElement) {
      titleElement.style.height = 'auto';
      titleElement.style.height = titleElement.scrollHeight + 'px';
    }
  }, [title]);

  // Prevent iOS zoom on input focus
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      const originalContent = viewport.getAttribute('content');
      
      const handleFocus = () => {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      };
      
      const handleBlur = () => {
        if (originalContent) {
          viewport.setAttribute('content', originalContent);
        }
      };
      
      const inputs = [titleRef.current, contentRef.current].filter(Boolean);
      inputs.forEach(input => {
        input?.addEventListener('focus', handleFocus);
        input?.addEventListener('blur', handleBlur);
      });
      
      return () => {
        inputs.forEach(input => {
          input?.removeEventListener('focus', handleFocus);
          input?.removeEventListener('blur', handleBlur);
        });
      };
    }
  }, []);

  // Update content when note changes
  useEffect(() => {
    if (note.content !== undefined && contentRef.current) {
      const currentContent = contentRef.current.innerHTML;
      if (currentContent !== note.content) {
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
        range.setStartAfter(img);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else {
        // No selection, append to end
        contentRef.current.appendChild(img);
      }

      // Trigger content change to save
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (error) {
      console.error('Failed to insert image:', error);
    }
  };

  // Handle paste events and strip formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    const pastedText = clipboardData.getData('text/plain');
    
    // Insert plain text only
    document.execCommand('insertText', false, pastedText);
  };

  // Simple checklist insertion at cursor
  const insertChecklistAtCursor = () => {
    if (!contentRef.current) return;

    const checklistId = `checklist-${Date.now()}`;
    const checklistData = {
      id: checklistId,
      items: [{ text: '', checked: false }]
    };

    // Create a simple data marker that will be restored to interactive checklist
    const dataMarker = document.createElement('div');
    dataMarker.setAttribute('data-checklist', JSON.stringify(checklistData));
    dataMarker.className = 'checklist-data';
    dataMarker.textContent = '[Checklist]'; // Temporary placeholder

    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range && contentRef.current.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(dataMarker);
      
      // Trigger content update to convert to interactive checklist
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Wait for update, then focus first input
      setTimeout(() => {
        const restored = contentRef.current?.querySelector(`[data-checklist-id="${checklistId}"] .checklist-input`) as HTMLInputElement;
        restored?.focus();
      }, 100);
    }
  };

  // Simplified event handlers restoration
  const restoreChecklistHandlers = () => {
    if (!contentRef.current) return;

    const checklists = contentRef.current.querySelectorAll('.checklist-container');
    
    checklists.forEach((container) => {
      const items = container.querySelectorAll('.checklist-item');
      
      items.forEach((item) => {
        const checkbox = item.querySelector('.checklist-checkbox') as HTMLButtonElement;
        const textInput = item.querySelector('.checklist-input') as HTMLInputElement;
        
        if (checkbox && textInput) {
          // Remove existing handlers to prevent duplicates
          checkbox.onclick = null;
          textInput.onkeydown = null;
          textInput.oninput = null;
          
          // Add fresh event handlers
          checkbox.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isChecked = checkbox.classList.contains('checked');
            
            if (isChecked) {
              checkbox.classList.remove('checked');
              checkbox.style.background = 'transparent';
              checkbox.style.color = 'transparent';
              checkbox.innerHTML = '';
              textInput.style.textDecoration = 'none';
              textInput.style.color = 'hsl(var(--foreground))';
            } else {
              checkbox.classList.add('checked');
              checkbox.style.background = 'hsl(var(--primary))';
              checkbox.style.color = 'hsl(var(--primary-foreground))';
              checkbox.innerHTML = '✓';
              textInput.style.textDecoration = 'line-through';
              textInput.style.color = 'hsl(var(--muted-foreground))';
            }

            // Trigger save
            contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
          };

          textInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (textInput.value.trim()) {
                // Add new item
                addChecklistItem(container as HTMLElement, item as HTMLElement);
              } else {
                // Remove empty item or exit checklist
                removeChecklistItem(container as HTMLElement, item as HTMLElement);
              }
            } else if (e.key === 'Backspace' && !textInput.value && textInput.selectionStart === 0) {
              e.preventDefault();
              removeChecklistItem(container as HTMLElement, item as HTMLElement);
            }
          };

          textInput.oninput = () => {
            contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
          };
        }
      });
    });
  };

  const addChecklistItem = (container: HTMLElement, afterItem: HTMLElement) => {
    const newItemDiv = document.createElement('div');
    newItemDiv.className = 'checklist-item';
    newItemDiv.style.display = 'flex';
    newItemDiv.style.alignItems = 'center';
    newItemDiv.style.gap = '12px';
    newItemDiv.style.marginBottom = '8px';
    newItemDiv.style.padding = '4px 0';

    const checkbox = document.createElement('button');
    checkbox.className = 'checklist-checkbox';
    checkbox.type = 'button';
    checkbox.style.width = '18px';
    checkbox.style.height = '18px';
    checkbox.style.borderRadius = '50%';
    checkbox.style.border = '2px solid hsl(var(--border))';
    checkbox.style.background = 'transparent';
    checkbox.style.color = 'transparent';
    checkbox.style.cursor = 'pointer';
    checkbox.style.flexShrink = '0';
    checkbox.style.display = 'flex';
    checkbox.style.alignItems = 'center';
    checkbox.style.justifyContent = 'center';
    checkbox.style.fontSize = '10px';
    checkbox.style.fontWeight = '600';

    const textInput = document.createElement('input');
    textInput.className = 'checklist-input';
    textInput.type = 'text';
    textInput.placeholder = 'List item';
    textInput.style.flex = '1';
    textInput.style.border = 'none';
    textInput.style.outline = 'none';
    textInput.style.background = 'transparent';
    textInput.style.fontSize = '0.875rem';
    textInput.style.fontFamily = 'inherit';
    textInput.style.color = 'hsl(var(--foreground))';

    newItemDiv.appendChild(checkbox);
    newItemDiv.appendChild(textInput);
    
    afterItem.parentNode?.insertBefore(newItemDiv, afterItem.nextSibling);
    textInput.focus();
    
    // Restore handlers for new item
    restoreChecklistHandlers();
  };

  const removeChecklistItem = (container: HTMLElement, item: HTMLElement) => {
    const items = container.querySelectorAll('.checklist-item');
    
    if (items.length === 1) {
      // Remove entire checklist if last item
      container.remove();
    } else {
      // Focus previous item if available
      const prevItem = item.previousElementSibling as HTMLElement;
      const nextItem = item.nextElementSibling as HTMLElement;
      
      item.remove();
      
      if (prevItem?.classList.contains('checklist-item')) {
        const input = prevItem.querySelector('.checklist-input') as HTMLInputElement;
        input?.focus();
      } else if (nextItem?.classList.contains('checklist-item')) {
        const input = nextItem.querySelector('.checklist-input') as HTMLInputElement;
        input?.focus();
      }
    }
    
    contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // Handle custom insert checklist event
  useEffect(() => {
    const handleInsertChecklist = () => {
      insertChecklistAtCursor();
    };

    window.addEventListener('insertChecklist', handleInsertChecklist);
    
    return () => {
      window.removeEventListener('insertChecklist', handleInsertChecklist);
    };
  }, []);

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

export default NoteEditor;