import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface NoteForExport {
  id: string;
  title: string;
  content: string;
  featured_image?: string;
  createdAt: string;
  updatedAt: string;
}

export const exportNoteToPDF = async (note: NoteForExport): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // Add title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(note.title || 'Untitled Note', contentWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 8 + 10;
  
  // Add featured image if exists
  if (note.featured_image) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = note.featured_image!;
      });
      
      // Calculate image dimensions to fit within page width
      const maxImageWidth = contentWidth;
      const maxImageHeight = 80; // Maximum height in mm
      
      const aspectRatio = img.width / img.height;
      let imageWidth = maxImageWidth;
      let imageHeight = imageWidth / aspectRatio;
      
      if (imageHeight > maxImageHeight) {
        imageHeight = maxImageHeight;
        imageWidth = imageHeight * aspectRatio;
      }
      
      // Check if image fits on current page
      if (yPosition + imageHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Center the image horizontally
      const imageX = (pageWidth - imageWidth) / 2;
      
      pdf.addImage(img, 'PNG', imageX, yPosition, imageWidth, imageHeight);
      yPosition += imageHeight + 10;
    } catch (error) {
      console.warn('Failed to load featured image for PDF export:', error);
    }
  }
  
  // Add content
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  // Convert HTML content to clean plain text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = note.content;
  
  // Handle images in content
  const images = tempDiv.querySelectorAll('img');
  for (const img of Array.from(images)) {
    const imgPlaceholder = document.createElement('div');
    imgPlaceholder.textContent = '[Image]';
    img.parentNode?.replaceChild(imgPlaceholder, img);
  }
  
  // Extract text and normalize whitespace to remove artificial line breaks from wrapping
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  const plainTextContent = textContent.replace(/\s+/g, ' ').trim();
  
  // Split content into lines that fit the page width
  const contentLines = pdf.splitTextToSize(plainTextContent, contentWidth);
  
  for (let i = 0; i < contentLines.length; i++) {
    // Check if we need a new page
    if (yPosition + 6 > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.text(contentLines[i], margin, yPosition);
    yPosition += 6;
  }
  
  // Add metadata footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  const dateStr = new Date(note.createdAt).toLocaleDateString();
  const footer = `Created: ${dateStr} | Exported from Noteily`;
  const footerY = pageHeight - 10;
  pdf.text(footer, margin, footerY);
  
  // Download the PDF
  const fileName = `${note.title || 'untitled-note'}.pdf`.replace(/[^\w\-_\. ]/g, '_');
  pdf.save(fileName);
};

export const exportNoteAsText = (note: NoteForExport): void => {
  // Convert HTML content to clean plain text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = note.content;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  const plainText = textContent.replace(/\s+/g, ' ').trim();
  
  const exportContent = `${note.title || 'Untitled Note'}\n\n${plainText}`;
  
  // Create blob and download
  const blob = new Blob([exportContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${note.title || 'untitled-note'}.txt`.replace(/[^\w\-_\. ]/g, '_');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};