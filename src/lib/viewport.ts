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
    
    // Adjust header position when keyboard opens/closes - but ensure it resets properly
    const noteHeader = document.querySelector('[data-note-header]') as HTMLElement;
    if (noteHeader) {
      if (keyboardOpen && !wasOpen) {
        // Keyboard opened - ensure header stays visible
        noteHeader.style.position = 'fixed';
        noteHeader.style.top = '0px';
        noteHeader.style.left = '0px';
        noteHeader.style.right = '0px';
        noteHeader.style.zIndex = '50';
        noteHeader.style.transform = 'none';
      } else if (!keyboardOpen && wasOpen) {
        // Keyboard closed - reset to original sticky behavior
        noteHeader.style.position = '';
        noteHeader.style.top = '';
        noteHeader.style.left = '';
        noteHeader.style.right = '';
        noteHeader.style.zIndex = '';
        noteHeader.style.transform = '';
      }
    }
  };

  // Also listen for visibility changes to reset header
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Reset header when page becomes visible again
      const noteHeader = document.querySelector('[data-note-header]') as HTMLElement;
      if (noteHeader) {
        noteHeader.style.position = '';
        noteHeader.style.top = '';
        noteHeader.style.left = '';
        noteHeader.style.right = '';
        noteHeader.style.zIndex = '';
        noteHeader.style.transform = '';
      }
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }
  
  return () => {};
};
