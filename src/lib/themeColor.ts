// Dynamic theme color management for browser chrome
export const updateThemeColor = () => {
  const html = document.documentElement;
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  
  if (!metaThemeColor) return;
  
  // Determine current theme by checking applied classes
  let themeColor = '#192028'; // Default navy
  
  if (html.classList.contains('light') || 
      (!html.classList.contains('dark') && 
       !html.classList.contains('navy') && 
       !html.classList.contains('sepia'))) {
    // Light theme
    themeColor = '#ffffff';
  } else if (html.classList.contains('dark')) {
    // Dark theme
    themeColor = '#0a0a0a';
  } else if (html.classList.contains('navy')) {
    // Navy theme (default)
    themeColor = '#192028';
  } else if (html.classList.contains('sepia')) {
    // Sepia theme
    themeColor = '#f5f1eb';
  }
  
  metaThemeColor.setAttribute('content', themeColor);
};

// Initialize theme color on page load
export const initializeThemeColor = () => {
  // Set initial theme color
  updateThemeColor();
  
  // Watch for theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updateThemeColor();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  return () => observer.disconnect();
};