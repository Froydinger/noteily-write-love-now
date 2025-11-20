
import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
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

// Error boundary for the editor
class EditorErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Editor error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-red-500">
          <p>Something went wrong with the editor.</p>
          <p className="text-sm mt-2">Try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Debounce utility
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Safe content getter - reduces direct innerHTML access
function getEditorContent(editor: HTMLDivElement | null): string {
  if (!editor) return '';
  return editor.innerHTML;
}

// Safe content setter - sanitizes before setting
function setEditorContent(editor: HTMLDivElement | null, content: string): void {
  if (!editor) return;
  const sanitized = sanitizeForDisplay(content);
  editor.innerHTML = sanitized;
}

interface NoteEditorProps {
  note: Note;
  onBlockTypeChange?: (type: BlockType) => void;
  onContentBeforeChange?: () => void;
  onSpellCheckApplied?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onAIContentReplace?: (replacementFunction: (newContent: string, isSelectionReplacement: boolean) => void) => void;
}

export default function NoteEditor({ note, onBlockTypeChange, onContentBeforeChange, onSpellCheckApplied, onUndo, canUndo, onAIContentReplace }: NoteEditorProps) {
  const titleFont = useTitleFont();
  const bodyFont = useBodyFont();
  const { updateNote } = useNotes();

  // Core state
  const [title, setTitle] = useState(note.title);
  const [lastSavedContent, setLastSavedContent] = useState(note.content);

  // Notification tracking (consolidated)
  const lastNotifiedStateRef = useRef({
    content: note.content,
    title: note.title
  });

  // Previous state for undo (consolidated)
  const previousStateRef = useRef({
    content: note.content,
    title: note.title
  });

  // DOM refs
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [showHandle, setShowHandle] = useState(false);
  const [currentBlockType, setCurrentBlockType] = useState<BlockType>('p');

  // Timers
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Update title and content when note changes (force update for undo/redo)
  useEffect(() => {
    // Always update title unless it's currently focused
    const titleHasFocus = document.activeElement === titleRef.current;
    if (!titleHasFocus && note.title !== title) {
      setTitle(note.title);
    }

    // Only update content if it's actually different AND user is not actively editing
    const currentContent = getEditorContent(contentRef.current);
    const sanitizedContent = sanitizeForDisplay(note.content);

    // Check if user is currently typing/editing in this element
    const selection = window.getSelection();
    const contentHasFocus = contentRef.current?.contains(document.activeElement) ||
                           (selection && selection.rangeCount > 0 && contentRef.current?.contains(selection.anchorNode));

    // Only update if content is different AND user is not focused in the editor
    if (sanitizedContent !== currentContent && !contentHasFocus) {
      setEditorContent(contentRef.current, sanitizedContent);
      contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, [note.id, note.title, note.content, note.featured_image, title]);

  // Send notifications after 5 minutes of inactivity
  const sendInactivityNotification = useCallback(async () => {
    if (!note.isSharedWithUser && (!note.shares || note.shares.length === 0)) {
      return; // No one to notify
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const currentContent = getEditorContent(contentRef.current);

      await supabase.functions.invoke('notify-note-update', {
        body: {
          noteId: note.id,
          originalContent: lastNotifiedStateRef.current.content,
          currentContent,
          originalTitle: lastNotifiedStateRef.current.title,
          currentTitle: title
        }
      });

      // Update our tracking state
      lastNotifiedStateRef.current = {
        content: currentContent,
        title
      };

      console.log('Inactivity notification sent for note:', note.id);
    } catch (error) {
      console.error('Failed to send inactivity notification:', error);
    }
  }, [note.id, note.isSharedWithUser, note.shares, title]);

  // Handle page leave - save with notification
  const handlePageLeave = useCallback(() => {
    const content = getEditorContent(contentRef.current);
    if (content) {
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
  }, [note.id, lastSavedContent, updateNote, sendInactivityNotification]);

  usePageLeave({ onPageLeave: handlePageLeave });

  // Handle content updates with debounce and inactivity tracking
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let undoTimeout: NodeJS.Timeout;

    const handleContentChange = (e?: Event) => {
      const content = getEditorContent(contentRef.current);
      if (!content && content !== '') return;

      // Clear any existing inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Start 5-minute inactivity timer
      inactivityTimerRef.current = setTimeout(() => {
        sendInactivityNotification();
      }, 5 * 60 * 1000); // 5 minutes

      clearTimeout(timeout);
      clearTimeout(undoTimeout);

      // Check if this is an AI update (has special data attribute)
      const isAIUpdate = e && (e as Event & { isAIUpdate?: boolean }).isAIUpdate;
      const delay = isAIUpdate ? 0 : 500; // Immediate save for AI updates, debounced for user typing

      // Debounce undo state save (only save after 1 second of no typing)
      undoTimeout = setTimeout(() => {
        onContentBeforeChange?.();
      }, 1000);

      timeout = setTimeout(() => {
        // Sanitize content before saving to database
        const sanitizedContent = sanitizeContent(content);

        // Force save for AI updates even if content seems unchanged
        if (isAIUpdate || sanitizedContent !== lastSavedContent) {
          updateNote(note.id, { content: sanitizedContent }, true); // Silent auto-save
          setLastSavedContent(sanitizedContent);
        }
      }, delay);
    };

    const currentRef = contentRef.current;

    if (currentRef) {
      currentRef.addEventListener('input', handleContentChange);
    }

    return () => {
      clearTimeout(timeout);
      clearTimeout(undoTimeout);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (currentRef) {
        currentRef.removeEventListener('input', handleContentChange);
      }
    };
  }, [note.id, updateNote, lastSavedContent, onContentBeforeChange, sendInactivityNotification]);

  // Handle AI content replacement - both selection and full content
  const replaceContentFromAI = useCallback((newContent: string, isSelectionReplacement: boolean = false) => {
    if (!contentRef.current) return;

    try {
      if (isSelectionReplacement) {
        // Replace only selected text
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);

          // Delete the selected content
          range.deleteContents();

          // Create a temporary div to parse the HTML (sanitize first)
          const sanitizedContent = sanitizeContent(newContent);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sanitizedContent;

          // Insert the new content preserving HTML structure and line breaks
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }

          range.insertNode(fragment);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // Replace entire content
        setEditorContent(contentRef.current, newContent);
      }

      // Trigger content change to save
      const event = new Event('input', { bubbles: true }) as Event & { isAIUpdate?: boolean };
      event.isAIUpdate = true;
      contentRef.current.dispatchEvent(event);
    } catch (error) {
      console.error('Error replacing content from AI:', error);
      // Fallback to simple replacement
      setEditorContent(contentRef.current, newContent);
    }
  }, []);

  // Expose AI replacement function to parent
  useEffect(() => {
    if (onAIContentReplace) {
      onAIContentReplace(replaceContentFromAI);
    }
  }, [onAIContentReplace, replaceContentFromAI]);

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
      
      // Clean up the content and process it properly
      const processElement = (element: Element): DocumentFragment => {
        const fragment = document.createDocumentFragment();
        
        // Process all child nodes
        for (const child of Array.from(element.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent?.trim();
            if (text) {
              fragment.appendChild(document.createTextNode(text));
            }
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childElement = child as Element;
            const tagName = childElement.tagName.toLowerCase();
            
            // Handle different element types
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
              const heading = document.createElement(tagName);
              heading.textContent = childElement.textContent || '';
              fragment.appendChild(heading);
              // Only add line break if there's more content after this heading
              const nextSibling = child.nextSibling;
              if (nextSibling && nextSibling.textContent?.trim()) {
                fragment.appendChild(document.createElement('br'));
              }
            } else if (tagName === 'p') {
              const para = document.createElement('p');
              para.textContent = childElement.textContent || '';
              fragment.appendChild(para);
            } else if (tagName === 'div') {
              // Process div content recursively but don't add extra breaks
              const text = childElement.textContent?.trim();
              if (text) {
                // Check if this div contains block-level content or just text
                const hasBlockElements = childElement.querySelector('h1, h2, h3, h4, h5, h6, p');
                if (hasBlockElements) {
                  const divContent = processElement(childElement);
                  fragment.appendChild(divContent);
                } else {
                  // Just text content, treat as paragraph
                  const para = document.createElement('p');
                  para.textContent = text;
                  fragment.appendChild(para);
                }
              }
            } else if (['strong', 'b'].includes(tagName)) {
              const strong = document.createElement('strong');
              strong.textContent = childElement.textContent || '';
              fragment.appendChild(strong);
            } else if (['em', 'i'].includes(tagName)) {
              const em = document.createElement('em');
              em.textContent = childElement.textContent || '';
              fragment.appendChild(em);
            } else if (tagName === 'u') {
              const u = document.createElement('u');
              u.textContent = childElement.textContent || '';
              fragment.appendChild(u);
            } else if (tagName === 'br') {
              fragment.appendChild(document.createElement('br'));
            } else {
              // For other elements, just extract text content
              const text = childElement.textContent?.trim();
              if (text) {
                fragment.appendChild(document.createTextNode(text));
              }
            }
          }
        }
        
        return fragment;
      };
      
      const processedFragment = processElement(tempDiv);
      
      // If we got some content, use it
      if (processedFragment.childNodes.length > 0) {
        range.insertNode(processedFragment);
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
  
  // Helper function for plain text insertion - preserves ALL blank lines
  const insertPlainText = (text: string, range: Range, selection: Selection) => {
    // Normalize line breaks: only standardize Windows line endings, preserve all blank lines
    const normalizedText = text
      .replace(/\r\n/g, '\n')  // Normalize Windows line endings to \n
      .replace(/\r/g, '\n');   // Normalize old Mac line endings to \n

    // Split by line breaks (don't trim to preserve leading/trailing newlines)
    const lines = normalizedText.split('\n');

    lines.forEach((line, index) => {
      // Insert text node for each line (including empty ones for blank lines)
      if (line.length > 0) {
        const textNode = document.createTextNode(line);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
      }

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

  // Block type detection with debouncing for performance
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

      setCurrentBlockType(prevType => {
        if (prevType !== newType) {
          onBlockTypeChange?.(newType);
          return newType;
        }
        return prevType;
      });
    };

    // Debounced version for input events (150ms delay)
    const debouncedUpdateBlockType = debounce(updateBlockType, 150);

    const handleFocus = () => {
      setShowHandle(true);
      updateBlockType(); // Immediate update on focus
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
      editor.addEventListener('input', debouncedUpdateBlockType);
      editor.addEventListener('keyup', debouncedUpdateBlockType);
    }

    // Use debounced version for selection change as well
    document.addEventListener('selectionchange', debouncedUpdateBlockType);

    return () => {
      if (editor) {
        editor.removeEventListener('focus', handleFocus);
        editor.removeEventListener('blur', handleBlur);
        editor.removeEventListener('input', debouncedUpdateBlockType);
        editor.removeEventListener('keyup', debouncedUpdateBlockType);
      }
      document.removeEventListener('selectionchange', debouncedUpdateBlockType);
    };
  }, [isReadOnly, onBlockTypeChange]);

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
    <EditorErrorBoundary>
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
            
            // Clear any existing save timeout
            if (titleSaveTimeoutRef.current) {
              clearTimeout(titleSaveTimeoutRef.current);
            }
            
            // Clear any existing undo state timeout
            if (undoStateTimeoutRef.current) {
              clearTimeout(undoStateTimeoutRef.current);
            }
            
            // Clear any existing inactivity timer
            if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
            }
            
            // Start 5-minute inactivity timer
            inactivityTimerRef.current = setTimeout(() => {
              sendInactivityNotification();
            }, 5 * 60 * 1000); // 5 minutes
            
            // Debounce undo state save (only save after 1 second of no typing)
            undoStateTimeoutRef.current = setTimeout(() => {
              onContentBeforeChange?.();
            }, 1000);
            
            // Debounce title save (500ms delay)
            titleSaveTimeoutRef.current = setTimeout(() => {
              updateNote(note.id, { title: newTitle }, true); // Silent title update
            }, 500);
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
        
        <div className="relative">
          <div
            ref={contentRef}
            contentEditable={!isReadOnly}
            className={`note-editor prose prose-sm md:prose-base max-w-none outline-none focus:outline-none pb-32 transition-colors duration-200 editor-anchor relative dynamic-body-font ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
            data-placeholder={isReadOnly ? "This note is read-only" : "Just start typing…"}
            aria-label="Note content"
            onPaste={isReadOnly ? undefined : handlePaste}
            onFocus={() => !isReadOnly && setShowHandle(true)}
          />

          {/* Block formatting handle */}
          {!isReadOnly && showHandle && (
            <div className="absolute left-0 top-0 -ml-12 mt-1">
              <BlockHandle
                visible={showHandle}
                currentType={currentBlockType}
                onSelect={handleBlockTypeSelect}
              />
            </div>
          )}
        </div>
        
        {!isReadOnly && (
          <TextEnhancementMenu
            noteId={note.id}
            content={contentRef.current?.innerHTML || ''}
            originalHTML={contentRef.current?.innerHTML || ''}
            onContentChange={(newHTML, isSelectionReplacement = false) => {
              console.log('TextEnhancementMenu onContentChange called with:', { newHTML, isSelectionReplacement });
              if (contentRef.current) {
                // Store previous state before making AI changes
                previousStateRef.current = {
                  content: getEditorContent(contentRef.current),
                  title
                };

                onContentBeforeChange?.();

                // Use the AI replacement function
                replaceContentFromAI(newHTML, isSelectionReplacement);

                onSpellCheckApplied?.();
                console.log('Content updated in editor and saved to cloud');
              }
            }}
            noteTitle={title}
            onTitleChange={(newTitle) => {
              console.log('TextEnhancementMenu onTitleChange called with:', newTitle);
              previousStateRef.current.title = title;
              setTitle(newTitle);
              updateNote(note.id, { title: newTitle }, false);
              console.log('Title updated and saved to cloud');
            }}
            previousContent={previousStateRef.current.content}
            previousTitle={previousStateRef.current.title}
          />
        )}
      </div>
    </div>
    </EditorErrorBoundary>
  );
};
