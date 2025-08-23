import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash, PanelLeft, PanelLeftClose, Users, Eye, Edit } from 'lucide-react';
import { BlockHandle, BlockType } from '@/components/notes/BlockHandle';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from '@/hooks/use-mobile';
import { FeaturedImageUpload } from '@/components/notes/FeaturedImageUpload';
import { ExportMenu } from '@/components/notes/ExportMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import type { Note } from '@/contexts/NoteContext';

interface HeaderContentProps {
  note: Note;
  currentBlockType: BlockType;
  onBlockTypeSelect: (type: BlockType) => void;
  onDelete: () => void;
  onShare: () => void;
  onFeaturedImageSet: (imageUrl: string) => void;
  onShowShareManager: () => void;
  className?: string;
}

export const HeaderContent = ({
  note,
  currentBlockType,
  onBlockTypeSelect,
  onDelete,
  onShare,
  onFeaturedImageSet,
  onShowShareManager,
  className = ""
}: HeaderContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-1">
        {isMobile ? (
          <div className="relative">
            <SidebarTrigger />
            {user && unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSidebar}
              className="btn-accessible p-2"
              title={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
            >
              {state === "expanded" ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </Button>
            {user && unreadCount > 0 && state === "collapsed" && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="btn-accessible p-2"
          title="Back to notes"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {note.isSharedWithUser && (
          <Badge variant="secondary" className="ml-1 flex items-center gap-1 px-2">
            <Users className="h-3 w-3" />
            {note.userPermission === 'read' ? (
              <Eye className="h-3 w-3" />
            ) : (
              <Edit className="h-3 w-3" />
            )}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {/* Formatting button - only show if not read-only */}
        {!note.isSharedWithUser || note.userPermission !== 'read' ? (
          <BlockHandle
            visible={true}
            currentType={currentBlockType}
            onSelect={onBlockTypeSelect}
          />
        ) : null}
        
        {/* Show people icon for owned notes (to share) or shared notes (to manage) */}
        {(note.isOwnedByUser || (note.isSharedWithUser && !note.isOwnedByUser)) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onShowShareManager}
            className="btn-accessible p-2"
            title={note.isOwnedByUser ? "Share note" : "Manage sharing"}
          >
            <Users className="h-4 w-4" />
          </Button>
        )}
        
        <FeaturedImageUpload 
          noteId={note.id}
          onImageSet={onFeaturedImageSet}
          hasImage={!!note.featured_image}
        />
        
        <ExportMenu
          note={note}
          onShare={onShare}
        />
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10">
              <Trash className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {note.isSharedWithUser && !note.isOwnedByUser ? 'Remove Access' : 'Delete Note'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {note.isSharedWithUser && !note.isOwnedByUser 
                  ? 'Are you sure you want to remove your access to this shared note? You will no longer be able to view or edit it.'
                  : 'Are you sure you want to delete this note? It will be moved to Recently Deleted where you can restore it within 7 days.'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="btn-accessible">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                {note.isSharedWithUser && !note.isOwnedByUser ? 'Remove Access' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};