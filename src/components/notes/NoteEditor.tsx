
import React, { useState, useEffect, useRef } from 'react';
import { useNotes, Note } from '@/contexts/NoteContext';
import DOMPurify from 'dompurify';
import { ImageUploadButton } from './ImageUploadButton';
import { FeaturedImage } from './FeaturedImage';
import { sanitizeContent, sanitizeForDisplay, sanitizeImageUrl, isValidImageUrl } from "@/lib/sanitization";
import { BlockHandle, BlockType } from './BlockHandle';
import { usePageLeave } from '@/hooks/usePageLeave';
import { useTitleFont, useBodyFont } from '@/hooks/useTitleFont';
import { SpellCheckButton } from './SpellCheckButton';
import { TextEnhancementMenu } from './TextEnhancementMenu';

interface NoteEditorProps {
  note: Note;
  onBlockTypeChange?: (type: BlockType) => void;
  onContentBeforeChange?: () => void;
  onSpellCheckApplied?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export default function NoteEditor({ note, onBlockTypeChange, onContentBeforeChange, onSpellCheckApplied, onUndo, canUndo }: NoteEditorProps) {
  const titleFont = useTitleFont();
  const bodyFont = useBodyFont();
  const { updateNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const [lastSavedContent, setLastSavedContent] = useState(note.content);
  const [lastNotifiedContent, setLastNotifiedContent] = useState(note.content);
  const [lastNotifiedTitle, setLastNotifiedTitle] = useState(note.title);
  const [previousContent, setPreviousContent] = useState(note.content);
  const [previousTitle, setPreviousTitle] = useState(note.title);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHandle, setShowHandle] = useState(false);
  const [currentBlockType, setCurrentBlockType] = useState<BlockType>('p');
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
    
    // Send final notification if there are unsent changes
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      sendInactivityNotification();
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

  // Update title and content when note changes (force update for undo/redo)
  useEffect(() => {
    setTitle(note.title);
    if (contentRef.current) {
      // Only update content if it's actually different to avoid cursor jumping
      const sanitizedContent = sanitizeForDisplay(note.content);
      const currentContent = contentRef.current.innerHTML;
      
      if (sanitizedContent !== currentContent) {
        // Save cursor position before updating
        const selection = window.getSelection();
        let savedRange = null;
        let cursorOffset = 0;
        
        if (selection && selection.rangeCount > 0 && contentRef.current.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0);
          savedRange = range.cloneRange();
          
          // Calculate cursor offset in text content
          const walker = document.createTreeWalker(
            contentRef.current,
            NodeFilter.SHOW_TEXT
          );
          
          let node;
          while (node = walker.nextNode()) {
            if (node === range.startContainer) {
              cursorOffset += range.startOffset;
              break;
            } else {
              cursorOffset += node.textContent?.length || 0;
            }
          }
        }
        
        contentRef.current.innerHTML = sanitizedContent;
        
        // Restore cursor position if we had one
        if (savedRange && contentRef.current.contains(savedRange.startContainer)) {
          try {
            selection?.removeAllRanges();
            selection?.addRange(savedRange);
          } catch (e) {
            // If exact position fails, try to restore by text offset
            try {
              const walker = document.createTreeWalker(
                contentRef.current,
                NodeFilter.SHOW_TEXT
              );
              
              let node;
              let currentOffset = 0;
              
              while (node = walker.nextNode()) {
                const nodeLength = node.textContent?.length || 0;
                if (currentOffset + nodeLength >= cursorOffset) {
                  const range = document.createRange();
                  range.setStart(node, Math.max(0, cursorOffset - currentOffset));
                  range.collapse(true);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                  break;
                }
                currentOffset += nodeLength;
              }
            } catch (e2) {
              // Final fallback: place cursor at end
              const range = document.createRange();
              range.selectNodeContents(contentRef.current);
              range.collapse(false);
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }
        }
        
        // Trigger any additional update events
        contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, [note.id, note.title, note.content]);


  // Send notifications after 5 minutes of inactivity
  const sendInactivityNotification = async () => {
    if (!note.isSharedWithUser && (!note.shares || note.shares.length === 0)) {
      return; // No one to notify
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase.functions.invoke('notify-note-update', {
        body: {
          noteId: note.id,
          originalContent: lastNotifiedContent,
          currentContent: contentRef.current?.innerHTML || '',
          originalTitle: lastNotifiedTitle,
          currentTitle: title
        }
      });

      // Update our tracking state
      setLastNotifiedContent(contentRef.current?.innerHTML || '');
      setLastNotifiedTitle(title);
      
      console.log('Inactivity notification sent for note:', note.id);
    } catch (error) {
      console.error('Failed to send inactivity notification:', error);
    }
  };

  // Handle content updates with debounce and inactivity tracking
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleContentChange = (e?: Event) => {
      if (contentRef.current) {
        const content = contentRef.current.innerHTML;
        
        // Clear any existing inactivity timer
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        
        // Start 5-minute inactivity timer
        inactivityTimerRef.current = setTimeout(() => {
          sendInactivityNotification();
        }, 5 * 60 * 1000); // 5 minutes
        
        clearTimeout(timeout);
        
        // Check if this is an AI update (has special data attribute)
        const isAIUpdate = e && (e as any).isAIUpdate;
        const delay = isAIUpdate ? 0 : 500; // Immediate save for AI updates, debounced for user typing
        
        timeout = setTimeout(() => {
          // Store undo state before making changes
          onContentBeforeChange?.();
          
          // Sanitize content before saving to database
          const sanitizedContent = sanitizeContent(content);
          
          // Force save for AI updates even if content seems unchanged
          if (isAIUpdate || sanitizedContent !== lastSavedContent) {
            updateNote(note.id, { content: sanitizedContent }, true); // Silent auto-save
            setLastSavedContent(sanitizedContent);
          }
        }, delay);
      }
    };

    const currentRef = contentRef.current;
    
    if (currentRef) {
      currentRef.addEventListener('input', handleContentChange);
    }
    
    return () => {
      clearTimeout(timeout);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (currentRef) {
        currentRef.removeEventListener('input', handleContentChange);
      }
    };
  }, [note.id, updateNote, lastNotifiedContent, lastNotifiedTitle, title]);

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

  // Handle paste events with HTML formatting preservation
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // Try to get HTML content first, then fallback to plain text
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    
    if (!htmlData && !textData) return;
    
    // Get current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    if (htmlData) {
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlData;
      
      // Preserve semantic elements like headings and paragraphs
      const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'b', 'i', 'u'];
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
            if (node.nodeType === Node.ELEMENT_NODE) {
              const tagName = (node as Element).tagName.toLowerCase();
              return allowedTags.includes(tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      // Extract and sanitize content while preserving structure
      const fragment = document.createDocumentFragment();
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeType === Node.TEXT_NODE) {
          fragment.appendChild(node.cloneNode(true));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const tagName = element.tagName.toLowerCase();
          
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tagName)) {
            const newElement = document.createElement(tagName);
            newElement.textContent = element.textContent || '';
            fragment.appendChild(newElement);
          } else if (tagName === 'br') {
            fragment.appendChild(document.createElement('br'));
          } else if (['strong', 'b'].includes(tagName)) {
            const strong = document.createElement('strong');
            strong.textContent = element.textContent || '';
            fragment.appendChild(strong);
          } else if (['em', 'i'].includes(tagName)) {
            const em = document.createElement('em');
            em.textContent = element.textContent || '';
            fragment.appendChild(em);
          } else if (tagName === 'u') {
            const u = document.createElement('u');
            u.textContent = element.textContent || '';
            fragment.appendChild(u);
          }
        }
      }
      
      // If we got some formatted content, use it
      if (fragment.childNodes.length > 0) {
        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback to plain text if HTML parsing failed
        insertPlainText(textData, range, selection);
      }
    } else {
      // Handle plain text with line break normalization
      insertPlainText(textData, range, selection);
    }
    
    // Trigger content change to save
    if (contentRef.current) {
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  
  // Helper function for plain text insertion
  const insertPlainText = (text: string, range: Range, selection: Selection) => {
    // Normalize line breaks: allow single and double, but collapse 3+ to double
    const normalizedText = text
      .replace(/\r\n/g, '\n')  // Normalize Windows line endings
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ line breaks with double (paragraph break)
      .trim();
    
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

  // Simple block type detection when editing
  useEffect(() => {
    if (isReadOnly) return;
    
    const updateBlockType = () => {
      const editor = contentRef.current;
      if (!editor) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) return;

      // Find the current block element
      let element = range.commonAncestorContainer;
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement!;
      }

      // Check if we're in an H1
      const h1 = (element as Element).closest('h1');
      const newType: BlockType = h1 ? 'h1' : 'p';
      setCurrentBlockType(newType);
      onBlockTypeChange?.(newType);
    };

    const handleFocus = () => {
      setShowHandle(true);
      updateBlockType();
    };

    const handleBlur = () => {
      // Delay hiding to allow for popover interactions
      setTimeout(() => {
        if (!document.activeElement?.closest('[data-radix-popper-content-wrapper]')) {
          setShowHandle(false);
        }
      }, 100);
    };

    const editor = contentRef.current;
    if (editor) {
      editor.addEventListener('focus', handleFocus);
      editor.addEventListener('blur', handleBlur);
      editor.addEventListener('input', updateBlockType);
      editor.addEventListener('keyup', updateBlockType);
    }
    
    document.addEventListener('selectionchange', updateBlockType);
    
    return () => {
      if (editor) {
        editor.removeEventListener('focus', handleFocus);
        editor.removeEventListener('blur', handleBlur);
        editor.removeEventListener('input', updateBlockType);
        editor.removeEventListener('keyup', updateBlockType);
      }
      document.removeEventListener('selectionchange', updateBlockType);
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
    <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-8">
      <div className="relative">
        <textarea
          data-title-input
          ref={titleRef}
          value={title}
          onChange={(e) => {
            if (isReadOnly) return;
            const newTitle = e.target.value;
            setTitle(newTitle);
            
            // Clear any existing inactivity timer
            if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
            }
            
            // Start 5-minute inactivity timer
            inactivityTimerRef.current = setTimeout(() => {
              sendInactivityNotification();
            }, 5 * 60 * 1000); // 5 minutes
            
            // Store undo state before making changes
            onContentBeforeChange?.();
            
            updateNote(note.id, { title: newTitle }, true); // Silent title update
          }}
          placeholder="Untitled Note"
          className={`w-full text-3xl font-${titleFont} font-medium mb-6 bg-transparent border-none outline-none px-0 focus:ring-0 focus:outline-none resize-none overflow-hidden dynamic-title-font ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
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
          className={`note-editor prose prose-sm md:prose-base max-w-none outline-none focus:outline-none pb-32 transition-none editor-anchor relative dynamic-body-font ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
          data-placeholder={isReadOnly ? "This note is read-only" : "Just start typing…"}
          aria-label="Note content"
          onPaste={isReadOnly ? undefined : handlePaste}
          onFocus={() => !isReadOnly && setShowHandle(true)}
        />
        
        {!isReadOnly && (
          <TextEnhancementMenu
            noteId={note.id}
            content={contentRef.current?.innerHTML || ''}
            originalHTML={contentRef.current?.innerHTML || ''}
            onContentChange={(newHTML) => {
              console.log('TextEnhancementMenu onContentChange called with:', newHTML);
              if (contentRef.current) {
                // Store previous state before making AI changes
                setPreviousContent(contentRef.current.innerHTML);
                setPreviousTitle(title);
                
                onContentBeforeChange?.();
                
                // Update content without cursor position issues
                contentRef.current.innerHTML = newHTML;
                
                // Immediately save AI changes to cloud (non-silent save)
                const sanitizedContent = sanitizeContent(newHTML);
                updateNote(note.id, { content: sanitizedContent }, false); // false = non-silent save
                setLastSavedContent(sanitizedContent);
                
                // Create a custom event to mark this as an AI update 
                const customEvent = new Event('input', { bubbles: true }) as any;
                customEvent.isAIUpdate = true;
                contentRef.current.dispatchEvent(customEvent);
                
                // Trigger undo state update by calling onContentBeforeChange again
                // This ensures the undo button becomes active after AI changes
                setTimeout(() => {
                  onContentBeforeChange?.();
                }, 100);
                
                onSpellCheckApplied?.();
                console.log('Content updated in editor and saved to cloud');
              }
            }}
            noteTitle={title}
            onTitleChange={(newTitle) => {
              console.log('TextEnhancementMenu onTitleChange called with:', newTitle);
              setPreviousTitle(title); // Store previous title
              setTitle(newTitle);
              // Immediately save AI title changes to cloud (non-silent save)
              updateNote(note.id, { title: newTitle }, false); // false = non-silent save
              console.log('Title updated and saved to cloud');
            }}
            previousContent={previousContent}
            previousTitle={previousTitle}
          />
        )}
      </div>
    </div>
  );
};
