import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Share, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportNoteToPDF, exportNoteAsText, type NoteForExport } from '@/lib/pdfExport';

interface ExportMenuProps {
  note: NoteForExport;
  onCopy: () => void;
  onShare: () => void;
}

export function ExportMenu({ note, onCopy, onShare }: ExportMenuProps) {
  const { toast } = useToast();

  const handlePDFExport = async () => {
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
    }
  };

  const handleTextExport = () => {
    try {
      exportNoteAsText(note);
      toast({
        title: "Text exported",
        description: "Your note has been saved as a text file.",
      });
    } catch (error) {
      console.error('Text export failed:', error);
      toast({
        title: "Export failed",
        description: "Failed to export text file. Please try again.",
        variant: "destructive",
      });
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
      
      {/* Export dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="btn-accessible"
            title="Export note"
          >
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleTextExport}>
            <FileText className="mr-2 h-4 w-4" />
            Export as Text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePDFExport}>
            <Download className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}