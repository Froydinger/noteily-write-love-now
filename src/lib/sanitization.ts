import DOMPurify from 'dompurify';

// Strict DOMPurify configuration for enhanced security
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'img', 'div', 'span', 'button', 'input'],
  ALLOWED_ATTR: ['src', 'alt', 'class', 'data-checklist', 'data-checklist-id', 'type', 'value', 'placeholder'],
  ALLOW_DATA_ATTR: false, // We'll manually allow specific data attributes
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'textarea'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  KEEP_CONTENT: true,
  SANITIZE_DOM: true,
};

/**
 * Validates if a URL is safe for image insertion
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Only allow https, data, and blob URLs
    const allowedProtocols = ['https:', 'data:', 'blob:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // For data URLs, ensure they're images and don't contain scripts
    if (urlObj.protocol === 'data:') {
      const dataPattern = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/i;
      if (!dataPattern.test(url)) {
        return false;
      }
      
      // Check for potential script injection in SVG data URLs
      if (url.toLowerCase().includes('script') || url.toLowerCase().includes('javascript')) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes image URL and attributes
 */
export function sanitizeImageUrl(url: string, alt?: string): { url: string; alt: string } {
  if (!isValidImageUrl(url)) {
    throw new Error('Invalid or unsafe image URL');
  }
  
  return {
    url: url,
    alt: alt ? DOMPurify.sanitize(alt, { ALLOWED_TAGS: [], KEEP_CONTENT: true }) : ''
  };
}

/**
 * Converts checklist HTML elements to safe data structure
 */
export function convertChecklistsToData(htmlContent: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Find all checklist containers
  const checklistContainers = tempDiv.querySelectorAll('.checklist-container');
  
  checklistContainers.forEach((container) => {
    const checklistId = container.getAttribute('data-checklist-id') || Date.now().toString();
    const items: Array<{ text: string; checked: boolean }> = [];
    
    // Extract checklist items from the actual structure
    const itemElements = container.querySelectorAll('.checklist-item');
    itemElements.forEach((item) => {
      const checkbox = item.querySelector('.checklist-checkbox') as HTMLElement;
      const textInput = item.querySelector('.checklist-input') as HTMLInputElement;
      
      if (textInput) {
        const text = textInput.value || textInput.textContent || '';
        const isChecked = checkbox?.style.background?.includes('var(--primary)') || 
                         checkbox?.classList.contains('checked') || false;
        items.push({ text: text.trim(), checked: isChecked });
      }
    });
    
    // Replace with safe data structure
    const newContainer = document.createElement('div');
    newContainer.className = 'checklist-container';
    newContainer.setAttribute('data-checklist', JSON.stringify(items));
    newContainer.setAttribute('data-checklist-id', checklistId || '');
    
    // Create visual representation
    items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'checklist-item';
      itemDiv.innerHTML = `
        <span class="checklist-checkbox ${item.checked ? 'checked' : ''}" data-index="${index}">
          ${item.checked ? '✓' : ''}
        </span>
        <span class="checklist-text ${item.checked ? 'checked' : ''}">${DOMPurify.sanitize(item.text, { ALLOWED_TAGS: [], KEEP_CONTENT: true })}</span>
      `;
      newContainer.appendChild(itemDiv);
    });
    
    container.parentNode?.replaceChild(newContainer, container);
  });
  
  return tempDiv.innerHTML;
}

/**
 * Restores checklist functionality from safe data structure
 */
export function restoreChecklistsFromData(htmlContent: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Find all checklist containers
  const checklistContainers = tempDiv.querySelectorAll('[data-checklist]');
  
  checklistContainers.forEach((container) => {
    const checklistData = container.getAttribute('data-checklist');
    const checklistId = container.getAttribute('data-checklist-id');
    
    if (!checklistData) return;
    
    try {
      const items: Array<{ text: string; checked: boolean }> = JSON.parse(checklistData);
      
      // Create interactive checklist HTML (exactly matching NoteEditor.tsx structure)
      const newContainer = document.createElement('div');
      newContainer.className = 'checklist-container';
      newContainer.contentEditable = 'false';
      newContainer.style.margin = '1rem 0';
      newContainer.setAttribute('data-checklist-id', checklistId || '');
      
      items.forEach((item) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'checklist-item';
        itemDiv.style.display = 'flex';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.gap = '12px';
        itemDiv.style.marginBottom = '8px';
        itemDiv.style.padding = '4px 0';

        // Create checkbox button (exactly matching NoteEditor structure)
        const checkbox = document.createElement('button');
        checkbox.className = 'checklist-checkbox';
        checkbox.type = 'button';
        checkbox.style.width = '18px';
        checkbox.style.height = '18px';
        checkbox.style.borderRadius = '50%';
        checkbox.style.border = '2px solid hsl(var(--border))';
        checkbox.style.background = item.checked ? 'hsl(var(--primary))' : 'transparent';
        checkbox.style.color = item.checked ? 'hsl(var(--primary-foreground))' : 'transparent';
        checkbox.style.cursor = 'pointer';
        checkbox.style.flexShrink = '0';
        checkbox.style.display = 'flex';
        checkbox.style.alignItems = 'center';
        checkbox.style.justifyContent = 'center';
        checkbox.style.fontSize = '10px';
        checkbox.style.fontWeight = '600';
        checkbox.innerHTML = item.checked ? '✓' : '';

        // Create text input (exactly matching NoteEditor structure)
        const textInput = document.createElement('input');
        textInput.className = 'checklist-input';
        textInput.type = 'text';
        textInput.value = item.text;
        textInput.placeholder = 'List item';
        textInput.style.flex = '1';
        textInput.style.border = 'none';
        textInput.style.outline = 'none';
        textInput.style.background = 'transparent';
        textInput.style.fontSize = 'inherit';
        textInput.style.fontFamily = 'inherit';
        textInput.style.color = item.checked ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))';
        textInput.style.textDecoration = item.checked ? 'line-through' : 'none';

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(textInput);
        newContainer.appendChild(itemDiv);
      });
      
      container.parentNode?.replaceChild(newContainer, container);
    } catch (e) {
      console.warn('Failed to parse checklist data:', e);
    }
  });
  
  return tempDiv.innerHTML;
}

/**
 * Main content sanitization function
 */
export function sanitizeContent(content: string, options: { preserveChecklists?: boolean } = {}): string {
  if (!content) return '';
  
  let processedContent = content;
  
  // Convert checklists to safe data structure if preserving them
  if (options.preserveChecklists) {
    processedContent = convertChecklistsToData(processedContent);
  }
  
  // Apply strict DOMPurify sanitization
  const sanitized = DOMPurify.sanitize(processedContent, SANITIZE_CONFIG);
  
  // Additional validation: remove any remaining script-like content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitized;
  
  // Remove any elements with javascript: URLs
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      if (attr.value.toLowerCase().includes('javascript:') || attr.value.toLowerCase().includes('data:text/html')) {
        element.removeAttribute(attr.name);
      }
    });
  });
  
  return tempDiv.innerHTML;
}

/**
 * Sanitize content for display (converts safe data back to interactive elements)
 */
export function sanitizeForDisplay(content: string): string {
  if (!content) return '';
  
  // First restore checklists from data
  const withChecklists = restoreChecklistsFromData(content);
  
  // Then apply basic sanitization (more permissive for display)
  return DOMPurify.sanitize(withChecklists, {
    ...SANITIZE_CONFIG,
    ALLOWED_TAGS: [...SANITIZE_CONFIG.ALLOWED_TAGS, 'input'],
    ALLOWED_ATTR: [...SANITIZE_CONFIG.ALLOWED_ATTR, 'type', 'checked', 'contenteditable'],
  });
}