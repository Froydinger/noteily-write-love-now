
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
      const textInput = item.querySelector('.checklist-text') as HTMLInputElement;
      
      if (checkbox && textInput) {
        // Re-attach event listeners
        setupChecklistItemEvents(item as HTMLElement, checkbox, textInput);
      }
    });
  }, [note.content]);


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

      const checklistItem = createChecklistItem('');
      checklistContainer.appendChild(checklistItem);
      contentRef.current.appendChild(checklistContainer);

      // Focus on the text input
      const textInput = checklistItem.querySelector('.checklist-text') as HTMLElement;
      if (textInput) {
        textInput.focus();
      }
    }

    // Trigger content change to save
    contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // Create a single checklist item
  const createChecklistItem = (text: string = '', checked: boolean = false) => {
    const item = document.createElement('div');
    item.className = 'checklist-item';

    const checkbox = document.createElement('div');
    checkbox.className = 'checklist-checkbox';

    if (checked) {
      checkbox.classList.add('checked');
      checkbox.innerHTML = '✓';
    }

    // Use input element instead of contentEditable div for better control
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'checklist-text';
    textInput.value = text;
    textInput.placeholder = 'List item';

    if (checked) {
      textInput.classList.add('completed');
    }

    // Setup event listeners
    setupChecklistItemEvents(item, checkbox, textInput);

    item.appendChild(checkbox);
    item.appendChild(textInput);

    return item;
  };

  // Setup checklist item event listeners
  const setupChecklistItemEvents = (item: HTMLElement, checkbox: HTMLElement, textInput: HTMLInputElement) => {
    // Handle checkbox click
    const handleCheckboxClick = () => {
      const isChecked = checkbox.classList.contains('checked');
      
      if (isChecked) {
        // Uncheck
        checkbox.classList.remove('checked');
        checkbox.innerHTML = '';
        textInput.classList.remove('completed');
      } else {
        // Check
        checkbox.classList.add('checked');
        checkbox.innerHTML = '✓';
        textInput.classList.add('completed');
      }

      // Trigger content change to save
      if (contentRef.current) {
        contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    // Handle text input events
    const handleTextKeydown = (e: KeyboardEvent) => {
      const container = item.closest('.checklist-container');
      if (!container) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if this is a double enter (empty current item)
        if (!textInput.value.trim()) {
          // Exit checklist mode - create normal paragraph after container
          const newParagraph = document.createElement('p');
          newParagraph.innerHTML = '<br>';
          newParagraph.style.minHeight = '1.2em';
          
          // Insert after the checklist container
          if (container.parentNode) {
            container.parentNode.insertBefore(newParagraph, container.nextSibling);
          }
          
          // Remove empty checklist item if it's the only one
          if (container.children.length === 1) {
            container.remove();
          } else {
            item.remove();
          }
          
          // Focus the new paragraph
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStart(newParagraph, 0);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } else {
          // Create new checklist item
          const newItem = createChecklistItem('');
          if (item.nextSibling) {
            container.insertBefore(newItem, item.nextSibling);
          } else {
            container.appendChild(newItem);
          }
          
          const newTextInput = newItem.querySelector('.checklist-text') as HTMLInputElement;
          if (newTextInput) {
            newTextInput.focus();
          }
        }
        
        // Trigger content change to save
        if (contentRef.current) {
          contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else if (e.key === 'Backspace' && !textInput.value && textInput.selectionStart === 0) {
        e.preventDefault();
        
        // Don't remove if it's the only item in the container
        if (container.children.length === 1) {
          return;
        }
        
        // Focus previous item if exists
        const prevItem = item.previousElementSibling;
        if (prevItem) {
          const prevTextInput = prevItem.querySelector('.checklist-text') as HTMLInputElement;
          if (prevTextInput) {
            prevTextInput.focus();
            // Move cursor to end
            prevTextInput.setSelectionRange(prevTextInput.value.length, prevTextInput.value.length);
          }
        }
        
        item.remove();
        
        // Trigger content change to save
        if (contentRef.current) {
          contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };

    // Handle input changes to save content
    const handleTextInput = () => {
      if (contentRef.current) {
        contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    // Attach event listeners
    checkbox.addEventListener('click', handleCheckboxClick);
    textInput.addEventListener('keydown', handleTextKeydown);
    textInput.addEventListener('input', handleTextInput);

    // Store event handlers for cleanup if needed
    (item as any)._checkboxHandler = handleCheckboxClick;
    (item as any)._textHandler = handleTextKeydown;
    (item as any)._inputHandler = handleTextInput;
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
