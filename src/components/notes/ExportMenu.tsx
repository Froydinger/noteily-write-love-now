import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportNoteToPDF, type NoteForExport } from '@/lib/pdfExport';

interface ExportMenuProps {
  note: NoteForExport;
  onCopy: () => void;
  onShare: () => void;
}

export function ExportMenu({ note, onCopy, onShare }: ExportMenuProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handlePDFExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      await exportNoteToPDF(note);
      toast({
        title: "PDF exported",
        description: "Your note has been saved as a PDF.",
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Copy button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="btn-accessible"
        title="Copy note"
      >
        <Copy className="h-4 w-4" />
      </Button>
      
      {/* Share button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onShare}
        className="btn-accessible"
        title="Share note"
      >
        <Share className="h-4 w-4" />
      </Button>
      
      {/* PDF Export button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePDFExport}
        disabled={isExporting}
        className="btn-accessible"
        title="Export as PDF"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}