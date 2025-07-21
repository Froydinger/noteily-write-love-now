import React, { useEffect, forwardRef } from 'react';
import DOMPurify from 'dompurify';

interface NoteContentProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  noteId: string;
}

const NoteContent = forwardRef<HTMLDivElement, NoteContentProps>(
  ({ content, onChange, placeholder = "Just start typing…", noteId }, ref) => {
    // Update content when note changes
    useEffect(() => {
      const contentElement = ref as React.MutableRefObject<HTMLDivElement | null>;
      if (contentElement?.current) {
        // Sanitize content to prevent XSS attacks
        const sanitizedContent = DOMPurify.sanitize(content);
        contentElement.current.innerHTML = sanitizedContent;
      }
    }, [noteId, content, ref]);

    // Handle content updates with debounce
    useEffect(() => {
      let timeout: NodeJS.Timeout;
      
      const handleContentChange = () => {
        const contentElement = ref as React.MutableRefObject<HTMLDivElement | null>;
        if (contentElement?.current) {
          const htmlContent = contentElement.current.innerHTML;
          
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            onChange(htmlContent);
          }, 500);
        }
      };

      const contentElement = ref as React.MutableRefObject<HTMLDivElement | null>;
      const currentRef = contentElement?.current;
      
      if (currentRef) {
        currentRef.addEventListener('input', handleContentChange);
      }
      
      return () => {
        clearTimeout(timeout);
        if (currentRef) {
          currentRef.removeEventListener('input', handleContentChange);
        }
      };
    }, [noteId, onChange, ref]);

    // Handle existing images in loaded content
    useEffect(() => {
      const contentElement = ref as React.MutableRefObject<HTMLDivElement | null>;
      if (!contentElement?.current) return;
      
      const images = contentElement.current.querySelectorAll('img');
      images.forEach((img) => {
        if (!img.hasAttribute('data-image-id')) {
          img.setAttribute('data-image-id', Date.now().toString());
          img.className = 'note-image';
        }
      });
    }, [content, ref]);

    return (
      <div
        ref={ref}
        contentEditable
        className="note-editor prose prose-sm md:prose-base max-w-none focus:outline-none dark:prose-invert min-h-[50vh] max-h-none h-auto transition-all duration-200"
        data-placeholder={placeholder}
        aria-label="Note content"
        style={{ maxHeight: 'none', height: 'auto' }}
        suppressContentEditableWarning={true}
      />
    );
  }
);

NoteContent.displayName = 'NoteContent';

export default NoteContent;