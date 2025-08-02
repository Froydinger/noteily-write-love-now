import React, { useRef, useEffect, useState } from 'react';
import { Note } from '@/contexts/NoteContext';
import { FeaturedImage } from './FeaturedImage';
import { ImageUploadButton } from './ImageUploadButton';
import { ChecklistTile, ChecklistData, ChecklistItem } from './ChecklistTile';
import { sanitizeImageUrl } from '@/lib/sanitization';

interface NoteEditorProps {
  note: Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  isReadOnly?: boolean;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'checklist' | 'image';
  data: any;
}

export function NoteEditor({ note, updateNote, isReadOnly = false }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize content blocks from note content
  useEffect(() => {
    if (note.content) {
      try {
        const blocks = JSON.parse(note.content);
        if (Array.isArray(blocks)) {
          setContentBlocks(blocks);
          return;
        }
      } catch (e) {
        // If not JSON, treat as legacy HTML content
      }
    }
    
    // Default to single text block
    setContentBlocks([{
      id: `text-${Date.now()}`,
      type: 'text',
      data: { html: note.content || '' }
    }]);
  }, [note.id]);

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

  // Save content when blocks change
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const content = JSON.stringify(contentBlocks);
      updateNote(note.id, { content });
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [contentBlocks, note.id, updateNote]);

  const updateContentBlock = (blockId: string, newData: any) => {
    setContentBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId ? { ...block, data: newData } : block
      )
    );
  };

  const deleteContentBlock = (blockId: string) => {
    setContentBlocks(blocks => blocks.filter(block => block.id !== blockId));
  };

  const insertChecklist = () => {
    const newChecklist: ChecklistData = {
      id: `checklist-${Date.now()}`,
      items: [{
        id: `item-${Date.now()}`,
        text: '',
        checked: false
      }]
    };

    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: 'checklist',
      data: newChecklist
    };

    setContentBlocks(blocks => [...blocks, newBlock]);
  };

  const insertImageAtCursor = (imageUrl: string) => {
    try {
      const { url: sanitizedUrl, alt } = sanitizeImageUrl(imageUrl, 'Uploaded image');
      
      const newBlock: ContentBlock = {
        id: `block-${Date.now()}`,
        type: 'image',
        data: {
          url: sanitizedUrl,
          alt,
          style: {
            width: '50%',
            height: 'auto',
            display: 'block',
            margin: '1rem auto',
            borderRadius: '8px'
          }
        }
      };

      setContentBlocks(blocks => [...blocks, newBlock]);
    } catch (error) {
      console.error('Failed to insert image:', error);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const pastedText = clipboardData.getData('text/plain');
    
    // Insert plain text into the current text block
    document.execCommand('insertText', false, pastedText);
  };

  // Handle custom format commands
  useEffect(() => {
    const handleFormatCommand = (event: CustomEvent) => {
      const { command } = event.detail;
      
      if (command === 'insertChecklist') {
        insertChecklist();
      }
    };

    window.addEventListener('formatCommand', handleFormatCommand as EventListener);
    
    return () => {
      window.removeEventListener('formatCommand', handleFormatCommand as EventListener);
    };
  }, []);

  // Handle legacy insertChecklist event
  useEffect(() => {
    const handleInsertChecklist = () => {
      insertChecklist();
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
        className={`w-full text-3xl font-serif font-medium mb-6 bg-transparent border-none outline-none px-0 focus:ring-0 resize-none overflow-hidden ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
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
      
      <div className="note-content">
        {contentBlocks.map((block) => {
          switch (block.type) {
            case 'text':
              return (
                <div
                  key={block.id}
                  ref={contentRef}
                  contentEditable={!isReadOnly}
                  className={`note-editor prose prose-sm md:prose-base max-w-none focus:outline-none min-h-[50vh] ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                  data-placeholder={isReadOnly ? "This note is read-only" : "Just start typing…"}
                  aria-label="Note content"
                  onPaste={isReadOnly ? undefined : handlePaste}
                  onInput={(e) => {
                    if (!isReadOnly) {
                      updateContentBlock(block.id, { html: e.currentTarget.innerHTML });
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: block.data.html || '' }}
                />
              );
            
            case 'checklist':
              return (
                <ChecklistTile
                  key={block.id}
                  data={block.data}
                  onChange={(newData) => updateContentBlock(block.id, newData)}
                  onDelete={() => deleteContentBlock(block.id)}
                  isReadOnly={isReadOnly}
                />
              );
            
            case 'image':
              return (
                <div key={block.id} className="my-4">
                  <img
                    src={block.data.url}
                    alt={block.data.alt}
                    style={block.data.style}
                    className="note-image"
                  />
                </div>
              );
            
            default:
              return null;
          }
        })}
      </div>
      
      {!isReadOnly && <ImageUploadButton onImageInsert={insertImageAtCursor} />}
    </div>
  );
}

export default NoteEditor;