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

// Simplified keyboard handling - no position manipulation
export const handleNoteKeyboard = () => {
  // Remove the complex viewport manipulation that was causing issues
  // Let the browser handle keyboard/viewport changes naturally
  return () => {};
};
