// Simplified viewport utilities for handling mobile keyboard behavior
export const handleViewportResize = () => {
  let isKeyboardOpen = false;
  
  const handleViewportChange = () => {
    if (!window.visualViewport) return;

    const viewportHeight = window.visualViewport.height;
    const windowHeight = window.innerHeight;
    const heightDiff = windowHeight - viewportHeight;

    // Keyboard is open if viewport height is significantly smaller
    const keyboardWasOpen = isKeyboardOpen;
    isKeyboardOpen = heightDiff > 150;

    // Only handle keyboard close - don't interfere when opening
    if (keyboardWasOpen && !isKeyboardOpen) {
      // Small delay to let the keyboard fully hide, then gently reset scroll
      setTimeout(() => {
        // Only scroll to top if we're on auth page or note page
        const isAuthPage = window.location.pathname === '/auth';
        const isNotePage = window.location.pathname.includes('/note/');
        
        if (isAuthPage || isNotePage) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    }
  };

  // Add event listeners
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportChange);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
  }
  
  return () => {}; // No-op cleanup for browsers without visualViewport
};

// Fix for iOS Safari viewport issues
export const preventViewportZoom = () => {
  // Prevent zoom on input focus for iOS
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach((input) => {
    input.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Temporarily increase font size to prevent zoom
        const originalFontSize = target.style.fontSize;
        target.style.fontSize = '16px';
        
        // Restore original font size after a delay
        setTimeout(() => {
          target.style.fontSize = originalFontSize;
        }, 100);
      }
    });
  });
};

// Handle keyboard hide for specific pages
export const handleKeyboardHide = () => {
  const isAuthPage = window.location.pathname === '/auth';
  const isNotePage = window.location.pathname.includes('/note/');
  
  if (isAuthPage || isNotePage) {
    // Force scroll to top when keyboard hides
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  }
};