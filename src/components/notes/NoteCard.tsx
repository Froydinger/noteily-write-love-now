
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef, useEffect } from 'react';

import { Note } from '@/contexts/NoteContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Edit, ArrowUpRight, Pin, Trash2 } from 'lucide-react';
import type { NoteWithSharing } from '@/types/sharing';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotes } from '@/contexts/NoteContext';

interface NoteCardProps {
  note: Note | NoteWithSharing;
  onShareClick?: (note: Note | NoteWithSharing) => void;
  isSelected?: boolean;
  onPress?: (note: Note | NoteWithSharing) => void;
  onOpen?: (note: Note | NoteWithSharing) => void;
  isPinned?: boolean;
  onTogglePin?: (note: Note | NoteWithSharing) => void;
  onDelete?: (note: Note | NoteWithSharing) => void;
}

export default function NoteCard({ note, onShareClick, isSelected = false, onPress, onOpen, isPinned = false, onTogglePin, onDelete }: NoteCardProps) {
  const { deleteNote } = useNotes();
  const isMobile = useIsMobile();
  
  // Swipe-to-delete state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const SWIPE_THRESHOLD = 60; // How far user needs to swipe to reveal delete
  const MAX_SWIPE = 80; // Maximum swipe distance
  
  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    
    // Only allow rightward swipe (positive deltaX)
    if (deltaX > 0) {
      const newOffset = Math.min(deltaX, MAX_SWIPE);
      setSwipeOffset(newOffset);
    }
  };
  
  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsDragging(false);
    
    // If not swiped far enough, snap back
    if (swipeOffset < SWIPE_THRESHOLD) {
      setSwipeOffset(0);
    } else {
      // Snap to the revealed position
      setSwipeOffset(MAX_SWIPE);
    }
  };
  
  const handleDeleteClick = async () => {
    setIsDeleting(true);
    try {
      await deleteNote(note.id);
      onDelete?.(note);
    } catch (error) {
      console.error('Failed to delete note:', error);
      setIsDeleting(false);
      setSwipeOffset(0);
    }
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    // If swiped, first click should reset, second click should open
    if (swipeOffset > 0) {
      setSwipeOffset(0);
      return;
    }
    onPress?.(note);
  };
  
  // Reset swipe when note changes or component updates
  useEffect(() => {
    setSwipeOffset(0);
    setIsDeleting(false);
  }, [note.id]);

  // Check if this note is shared with the user (they don't own it)
  const isSharedWithUser = 'isSharedWithUser' in note && note.isSharedWithUser && !note.isOwnedByUser;
  
  // Check if this note is shared by the user (they own it and have shared it with others)
  const isSharedByUser = 'shares' in note && note.shares && note.shares.length > 0;
  
  const contentPreview = note.content 
    ? note.content
        .replace(/<\/p>/gi, ' ')
        .replace(/<\/div>/gi, ' ')
        .replace(/<br\s*\/>?/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;[^&]*&gt;/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        // Intentionally do not decode &lt; or &gt; to avoid showing fake tags
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, ' ')
        .trim()
    : 'No content';
  
  const truncatedContent = contentPreview.length > 120 
    ? contentPreview.substring(0, 120) + '...'
    : contentPreview;

  const selectedStyles = isSelected ? 'ring-2 ring-primary/40 border-primary/40' : '';

  return (
    <div className="relative overflow-hidden">
      {/* Delete button that appears behind the card */}
      {isMobile && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive text-destructive-foreground transition-all duration-200 ease-out rounded-r-lg"
          style={{ 
            width: `${MAX_SWIPE}px`,
            transform: `translateX(${MAX_SWIPE - swipeOffset}px)`,
            opacity: swipeOffset > 20 ? 1 : 0
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-full w-full rounded-none text-white hover:bg-destructive/80 disabled:opacity-50"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      <Card 
        ref={cardRef}
        className={`h-full cursor-pointer group interactive-card ${!isMobile ? 'hover:border-accent/50' : ''} animate-float-in relative backdrop-blur-sm bg-card/95 ${selectedStyles} transition-transform duration-200 ease-out`}
        style={isMobile ? { transform: `translateX(${swipeOffset}px)` } : {}}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      {/* Share button in top right corner */}
      {onShareClick && (
        <Button
          variant="ghost"
          size="sm"
          className={`absolute top-2 right-2 h-8 w-8 rounded-full p-0 transition-opacity duration-200 hover:bg-accent z-10 ${isSelected ? 'opacity-100 pointer-events-auto' : (!isMobile ? 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto' : 'opacity-0 pointer-events-none')}`}
          onClick={(e) => {
            e.stopPropagation();
            onShareClick(note);
          }}
        >
          <Users className="h-4 w-4" />
        </Button>
      )}
      
      {/* Pin toggle */}
      <Button
        variant="secondary"
        size="sm"
        className={`absolute bottom-2 right-11 h-7 w-7 rounded-full p-0 shadow-sm z-10 ${isMobile ? '' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'} ${isPinned ? 'text-primary border-primary/30 bg-primary/10' : ''}`}
        aria-label={isPinned ? 'Unpin note' : 'Pin note'}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin?.(note);
        }}
      >
        <Pin className="h-3.5 w-3.5" fill={isPinned ? "currentColor" : "none"} />
      </Button>

      {/* Quick open arrow */}
      <Button
        variant="secondary"
        size="sm"
        className={`absolute bottom-2 right-2 h-7 w-7 rounded-full p-0 shadow-sm z-10 ${isMobile ? '' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}`}
        aria-label="Open note"
        onClick={(e) => {
          e.stopPropagation();
          onOpen?.(note);
        }}
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Button>
      <CardContent className={`p-4 transition-all duration-300 ${!isMobile ? 'group-hover:translate-y-[-1px]' : ''} select-none`}>
        {/* Shared note tags at top of content */}
        {isSharedWithUser && (
          <Badge 
            variant="secondary" 
            className="h-6 px-2 text-xs flex items-center gap-1 mb-3 w-fit"
          >
            {('userPermission' in note && note.userPermission === 'read') ? (
              <Eye className="h-3 w-3" />
            ) : (
              <Edit className="h-3 w-3" />
            )}
            Shared With Me
          </Badge>
        )}
        
        {isSharedByUser && (
          <Badge 
            variant="secondary" 
            className="h-6 px-2 text-xs flex items-center gap-1 mb-3 w-fit"
          >
            <Users className="h-3 w-3" />
            I Shared
          </Badge>
        )}
        <h3 className="font-medium text-lg font-serif break-words overflow-wrap-anywhere leading-tight text-foreground transition-colors duration-300 mb-3">{note.title || "Untitled Note"}</h3>
        <p className={`text-sm text-muted-foreground line-clamp-4 ${!isMobile ? 'group-hover:text-foreground/90' : ''} transition-colors duration-300 leading-relaxed`}>{truncatedContent}</p>
      </CardContent>
      <CardFooter className={`p-4 pt-0 text-xs text-muted-foreground transition-all duration-300 ${!isMobile ? 'group-hover:text-muted-foreground/80' : ''}`}>
        Last modified {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </CardFooter>
      </Card>
    </div>
  );
}
