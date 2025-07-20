// Viewport utilities for handling mobile keyboard behavior
export const handleViewportResize = () => {
  let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
  let currentScrollPosition = 0;

  const handleViewportChange = () => {
    if (!window.visualViewport) return;

    const currentViewportHeight = window.visualViewport.height;
    const heightDifference = initialViewportHeight - currentViewportHeight;

    // If viewport height decreased significantly (keyboard appeared)
    if (heightDifference > 150) {
      currentScrollPosition = window.scrollY;
    }
    // If viewport height increased back (keyboard disappeared)
    else if (heightDifference < 50 && currentScrollPosition > 0) {
      // Small delay to ensure keyboard is fully hidden
      setTimeout(() => {
        window.scrollTo(0, 0);
        currentScrollPosition = 0;
      }, 100);
    }
  };

  // Handle resize events
  const handleResize = () => {
    if (!window.visualViewport) {
      // Fallback for browsers without visualViewport
      const newHeight = window.innerHeight;
      const heightDiff = initialViewportHeight - newHeight;
      
      if (heightDiff < 50) {
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
      }
    }
  };

  // Add event listeners
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportChange);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
  } else {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }
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