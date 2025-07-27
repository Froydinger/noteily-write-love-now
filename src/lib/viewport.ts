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

// Basic keyboard detection - only for auth page
export const handleAuthKeyboard = () => {
  let keyboardOpen = false;
  
  const handleResize = () => {
    if (!window.visualViewport) return;
    
    const heightDiff = window.innerHeight - window.visualViewport.height;
    const wasOpen = keyboardOpen;
    keyboardOpen = heightDiff > 150;
    
    // Only scroll to top when keyboard closes on auth page
    if (wasOpen && !keyboardOpen && window.location.pathname === '/auth') {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport.removeEventListener('resize', handleResize);
  }
  
  return () => {};
};
