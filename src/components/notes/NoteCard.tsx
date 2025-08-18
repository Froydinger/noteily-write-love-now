
import { formatDistanceToNow } from 'date-fns';

import { Note } from '@/contexts/NoteContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Edit, ArrowUpRight, Pin, Trash2 } from 'lucide-react';
import type { NoteWithSharing } from '@/types/sharing';
import { useIsMobile } from '@/hooks/use-mobile';

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
  
  const isMobile = useIsMobile();
  
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
    <Card 
      className={`h-full cursor-pointer group interactive-card ${!isMobile ? 'hover:border-accent/50' : ''} animate-float-in relative backdrop-blur-sm bg-card/95 ${selectedStyles}`}
      onClick={(e) => { e.stopPropagation(); onPress?.(note); }}
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
      
      {/* Delete button - shows when selected, positioned top right */}
      {onDelete && isSelected && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-11 h-8 w-8 rounded-full p-0 shadow-sm z-10 animate-fade-in opacity-50"
          aria-label="Delete note"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
        >
          <Trash2 className="h-4 w-4" />
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
  );
}
