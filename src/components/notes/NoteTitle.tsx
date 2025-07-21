import React, { useEffect, forwardRef } from 'react';

interface NoteTitleProps {
  value: string;
  onChange: (title: string) => void;
  placeholder?: string;
}

const NoteTitle = forwardRef<HTMLTextAreaElement, NoteTitleProps>(
  ({ value, onChange, placeholder = "Untitled Note" }, ref) => {
    // Auto-resize title textarea
    useEffect(() => {
      const textarea = ref as React.MutableRefObject<HTMLTextAreaElement | null>;
      if (textarea?.current) {
        textarea.current.style.height = 'auto';
        textarea.current.style.height = textarea.current.scrollHeight + 'px';
      }
    }, [value, ref]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
    };

    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={handleInput}
        placeholder={placeholder}
        className="w-full text-3xl font-serif font-medium mb-8 bg-transparent border-none outline-none px-0 focus:ring-0 resize-none overflow-hidden transition-all duration-200 placeholder:text-muted-foreground/60"
        style={{ 
          minHeight: 'auto',
          height: 'auto'
        }}
        rows={1}
        aria-label="Note title"
      />
    );
  }
);

NoteTitle.displayName = 'NoteTitle';

export default NoteTitle;