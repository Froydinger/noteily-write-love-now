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
 * Simple checklist data structure for storage
 */
export interface ChecklistData {
  id: string;
  items: Array<{ text: string; checked: boolean }>;
}

/**
 * Convert HTML checklist elements to JSON data for storage
 */
export function extractChecklistsFromHtml(htmlContent: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Find all checklist containers
  const checklistContainers = tempDiv.querySelectorAll('[data-checklist-id]');
  
  checklistContainers.forEach((container) => {
    const checklistId = container.getAttribute('data-checklist-id') || '';
    const items: Array<{ text: string; checked: boolean }> = [];
    
    // Extract items from container
    const itemElements = container.querySelectorAll('.checklist-item');
    itemElements.forEach((item) => {
      const checkbox = item.querySelector('.checklist-checkbox') as HTMLElement;
      const textInput = item.querySelector('.checklist-input') as HTMLInputElement;
      
      if (textInput) {
        const text = textInput.value || textInput.textContent || '';
        const isChecked = checkbox?.classList.contains('checked') || 
                         checkbox?.style.background?.includes('primary') || false;
        items.push({ text: text.trim(), checked: isChecked });
      }
    });
    
    // Replace with data marker
    const dataMarker = document.createElement('div');
    dataMarker.setAttribute('data-checklist', JSON.stringify({ id: checklistId, items }));
    dataMarker.className = 'checklist-data';
    container.parentNode?.replaceChild(dataMarker, container);
  });
  
  return tempDiv.innerHTML;
}

/**
 * Convert JSON checklist data back to simple HTML for storage
 */
export function convertChecklistsToStorageFormat(htmlContent: string): string {
  return extractChecklistsFromHtml(htmlContent);
}

/**
 * Convert stored checklist data back to interactive HTML
 */
export function restoreChecklistsForDisplay(htmlContent: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Find all checklist data markers
  const dataMarkers = tempDiv.querySelectorAll('[data-checklist]');
  
  dataMarkers.forEach((marker) => {
    const checklistDataStr = marker.getAttribute('data-checklist');
    if (!checklistDataStr) return;
    
    try {
      const checklistData: ChecklistData = JSON.parse(checklistDataStr);
      
      // Create interactive checklist container
      const container = document.createElement('div');
      container.className = 'checklist-container';
      container.contentEditable = 'false';
      container.style.margin = '1rem 0';
      container.style.padding = '0.75rem';
      container.style.borderRadius = '0.5rem';
      container.style.border = '1px solid hsl(var(--border) / 0.5)';
      container.style.background = 'hsl(var(--card) / 0.5)';
      container.setAttribute('data-checklist-id', checklistData.id);
      
      checklistData.items.forEach((item) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'checklist-item';
        itemDiv.style.display = 'flex';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.gap = '12px';
        itemDiv.style.marginBottom = '8px';
        itemDiv.style.padding = '4px 0';

        // Create checkbox
        const checkbox = document.createElement('button');
        checkbox.className = `checklist-checkbox ${item.checked ? 'checked' : ''}`;
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

        // Create text input
        const textInput = document.createElement('input');
        textInput.className = 'checklist-input';
        textInput.type = 'text';
        textInput.value = item.text;
        textInput.placeholder = 'List item';
        textInput.style.flex = '1';
        textInput.style.border = 'none';
        textInput.style.outline = 'none';
        textInput.style.background = 'transparent';
        textInput.style.fontSize = '0.875rem';
        textInput.style.fontFamily = 'inherit';
        textInput.style.color = item.checked ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))';
        textInput.style.textDecoration = item.checked ? 'line-through' : 'none';

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(textInput);
        container.appendChild(itemDiv);
      });
      
      marker.parentNode?.replaceChild(container, marker);
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
  
  // Convert checklists to storage format if preserving them
  if (options.preserveChecklists) {
    processedContent = convertChecklistsToStorageFormat(processedContent);
  }
  
  // Apply strict DOMPurify sanitization
  const sanitized = DOMPurify.sanitize(processedContent, SANITIZE_CONFIG);
  
  return sanitized;
}

/**
 * Sanitize content for display (converts storage data back to interactive elements)
 */
export function sanitizeForDisplay(content: string): string {
  if (!content) return '';
  
  // First restore checklists from storage format
  const withChecklists = restoreChecklistsForDisplay(content);
  
  // Then apply permissive sanitization for display
  return DOMPurify.sanitize(withChecklists, {
    ...SANITIZE_CONFIG,
    ALLOWED_TAGS: [...SANITIZE_CONFIG.ALLOWED_TAGS, 'input'],
    ALLOWED_ATTR: [...SANITIZE_CONFIG.ALLOWED_ATTR, 'type', 'checked', 'contenteditable', 'data-checklist-id'],
  });
}