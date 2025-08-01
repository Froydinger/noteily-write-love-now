import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Share, ListChecks, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportNoteToPDF, type NoteForExport } from '@/lib/pdfExport';
import { ShareModal } from './ShareModal';
import { SharedNotesManager } from './SharedNotesManager';
import { useAuth } from '@/contexts/AuthContext';

interface ExportMenuProps {
  note: NoteForExport;
  onShare: () => void;
  onInsertChecklist: () => void;
}

export function ExportMenu({ note, onShare, onInsertChecklist }: ExportMenuProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSharedManager, setShowSharedManager] = useState(false);
  
  
  const isOwner = user?.id === (note as any).user_id;
  const isSharedNote = (note as any).isShared;

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
          {isOwner ? (
            <>
              <DropdownMenuItem onClick={() => {
                if (isSharedNote) {
                  setShowSharedManager(true);
                } else {
                  setShowShareModal(true);
                }
              }}>
                <Users className="h-4 w-4 mr-2" />
                {isSharedNote ? 'Manage Sharing' : 'Share w/ Noteily'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share className="h-4 w-4 mr-2" />
                Share w/ Other
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setShowSharedManager(true)}>
                <Users className="h-4 w-4 mr-2" />
                View Sharing Info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share className="h-4 w-4 mr-2" />
                Share w/ Other
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
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

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        noteId={note.id}
        noteTitle={note.title}
      />

      {/* Shared Notes Manager */}
      <SharedNotesManager
        isOpen={showSharedManager}
        onClose={() => setShowSharedManager(false)}
        noteId={note.id}
        noteTitle={note.title}
        isOwner={isOwner}
      />
    </>
  );
}