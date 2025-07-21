import { useEffect, RefObject } from 'react';

interface UseKeyboardScrollProps {
  titleRef: RefObject<HTMLTextAreaElement>;
  contentRef: RefObject<HTMLDivElement>;
}

export function useKeyboardScroll({ titleRef, contentRef }: UseKeyboardScrollProps) {
  useEffect(() => {
    let keyboardIsOpen = false;
    
    const scrollActiveElementIntoView = () => {
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement === titleRef.current || activeElement === contentRef.current)) {
          // Position the element at the top of the visible area to stay above keyboard
          activeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
          
          // Add extra offset to ensure it's clearly above keyboard
          window.scrollBy(0, -120);
        }
      }, 100);
    };
    
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.screen.height;
      const keyboardHeight = screenHeight - viewportHeight;
      
      // Track keyboard state
      const wasKeyboardOpen = keyboardIsOpen;
      keyboardIsOpen = keyboardHeight > 200;
      
      // Only trigger scroll when keyboard first opens, not when it's already open
      if (keyboardIsOpen && !wasKeyboardOpen) {
        scrollActiveElementIntoView();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      if (e.key === 'Enter' && target === contentRef.current) {
        // Handle line breaks in contentEditable
        e.preventDefault();
        document.execCommand('insertHTML', false, '<br>');
        
        // Realign cursor above keyboard after line break
        if (keyboardIsOpen) {
          setTimeout(scrollActiveElementIntoView, 50);
        }
      }
      
      // General typing realignment when keyboard is open
      if (keyboardIsOpen && e.key.length === 1) {
        setTimeout(scrollActiveElementIntoView, 100);
      }
    };

    // Add event listeners
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    // Add keydown listeners to both elements
    const titleElement = titleRef.current;
    const contentElement = contentRef.current;
    
    if (titleElement) {
      titleElement.addEventListener('keydown', handleKeyDown);
    }
    
    if (contentElement) {
      contentElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      if (titleElement) {
        titleElement.removeEventListener('keydown', handleKeyDown);
      }
      if (contentElement) {
        contentElement.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [titleRef, contentRef]);
}