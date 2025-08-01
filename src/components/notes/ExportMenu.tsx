import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, ListChecks, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportNoteToPDF, type NoteForExport } from '@/lib/pdfExport';

interface ExportMenuProps {
  note: NoteForExport;
  onShare: () => void;
  onInsertChecklist: () => void;
}

export function ExportMenu({ note, onShare, onInsertChecklist }: ExportMenuProps) {
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
      {/* Checklist button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onInsertChecklist}
        className="btn-accessible"
        title="Insert checklist"
      >
        <ListChecks className="h-4 w-4" />
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