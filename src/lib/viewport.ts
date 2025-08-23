// Simple iOS zoom prevention - tried and true approach
export const preventViewportZoom = () => {
  // Prevent zoom on input focus for iOS Safari
  const inputs = document.querySelectorAll('input, textarea, [contenteditable]');
  inputs.forEach((input) => {
    const element = input as HTMLElement;
    
    // Set font size to 16px to prevent zoom
    if (element.style.fontSize === '' || parseFloat(element.style.fontSize) < 16) {
      element.style.fontSize = '16px';
    }
  });
};

// Keyboard-aware viewport handling for note editor
export const handleNoteKeyboard = () => {
  let keyboardOpen = false;
  
  const handleResize = () => {
    if (!window.visualViewport) return;
    
    const heightDiff = window.innerHeight - window.visualViewport.height;
    const wasOpen = keyboardOpen;
    keyboardOpen = heightDiff > 150;
    
    // Adjust header position when keyboard opens/closes
    const noteHeader = document.querySelector('[data-note-header]') as HTMLElement;
    if (noteHeader) {
      if (keyboardOpen && !wasOpen) {
        // Keyboard opened - ensure header stays visible
        noteHeader.style.position = 'fixed';
        noteHeader.style.top = '0px';
        noteHeader.style.left = '0px';
        noteHeader.style.right = '0px';
        noteHeader.style.zIndex = '50';
      } else if (!keyboardOpen && wasOpen) {
        // Keyboard closed - reset to sticky
        noteHeader.style.position = 'sticky';
        noteHeader.style.top = '0px';
        noteHeader.style.left = 'auto';
        noteHeader.style.right = 'auto';
        noteHeader.style.zIndex = '40';
      }
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport.removeEventListener('resize', handleResize);
  }
  
  return () => {};
};
