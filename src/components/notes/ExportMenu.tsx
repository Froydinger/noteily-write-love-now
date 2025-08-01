import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Share, ListChecks, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportNoteToPDF, type NoteForExport } from '@/lib/pdfExport';
import { ShareManager } from './ShareManager';
import { useAuth } from '@/contexts/AuthContext';
import type { NoteWithSharing } from '@/types/sharing';

interface ExportMenuProps {
  note: NoteWithSharing;
  onShare: () => void;
  onInsertChecklist: () => void;
  onShareUpdate?: () => void;
}

export function ExportMenu({ note, onShare, onInsertChecklist, onShareUpdate }: ExportMenuProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [showShareManager, setShowShareManager] = useState(false);

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
      
      {/* Share dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="btn-accessible"
            title="Share note"
          >
            <Share className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 bg-popover border shadow-lg">
          <DropdownMenuItem onClick={() => setShowShareManager(true)}>
            <Users className="h-4 w-4 mr-2" />
            {note.isOwnedByUser ? 'Manage Sharing' : 'View Sharing Info'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShare}>
            <Share className="h-4 w-4 mr-2" />
            Share w/ Other
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePDFExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Manager */}
      <ShareManager
        isOpen={showShareManager}
        onClose={() => setShowShareManager(false)}
        note={note}
        onShareUpdate={onShareUpdate}
      />
    </>
  );
}