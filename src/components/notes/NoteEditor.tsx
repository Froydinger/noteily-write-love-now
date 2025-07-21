
import React, { useRef } from 'react';
import { useNotes, Note } from '@/contexts/NoteContext';
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';
import { ImageUploadButton } from './ImageUploadButton';
import NoteTitle from './NoteTitle';
import NoteContent from './NoteContent';

interface NoteEditorProps {
  note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote } = useNotes();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Enhanced keyboard handling and scrolling
  useKeyboardScroll({ titleRef, contentRef });

  // Handle image insertion at cursor position
  const insertImageAtCursor = (imageUrl: string) => {
    if (!contentRef.current) return;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = '100%';
    img.style.maxWidth = '600px';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '1.5rem auto';
    img.style.borderRadius = '12px';
    img.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
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

  // Handle title updates
  const handleTitleChange = (newTitle: string) => {
    updateNote(note.id, { title: newTitle });
  };

  // Handle content updates
  const handleContentChange = (newContent: string) => {
    updateNote(note.id, { content: newContent });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 pt-12 pb-96 animate-fade-in">
      <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-lg">
        <NoteTitle
          ref={titleRef}
          value={note.title}
          onChange={handleTitleChange}
        />
        
        <NoteContent
          ref={contentRef}
          content={note.content}
          onChange={handleContentChange}
          noteId={note.id}
        />
        
        <ImageUploadButton onImageInsert={insertImageAtCursor} />
      </div>
    </div>
  );
}
