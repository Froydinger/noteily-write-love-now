
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

import { Note } from '@/contexts/NoteContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Edit, ArrowUpRight, Pin, Trash2, CheckSquare, Circle, CheckCircle2, Clock, Copy } from 'lucide-react';
import type { NoteWithSharing, ChecklistItem } from '@/types/sharing';
import { useIsTouchDevice } from '@/hooks/use-touch-device';
import { useTitleFont } from '@/hooks/useTitleFont';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface NoteCardProps {
  note: Note | NoteWithSharing;
  onShareClick?: (note: Note | NoteWithSharing) => void;
  isSelected?: boolean;
  onPress?: (note: Note | NoteWithSharing) => void;
  onOpen?: (note: Note | NoteWithSharing) => void;
  isPinned?: boolean;
  onTogglePin?: (note: Note | NoteWithSharing) => void;
  onDelete?: (note: Note | NoteWithSharing) => void;
  onDuplicate?: (note: Note | NoteWithSharing) => void;
}

export default function NoteCard({ note, onShareClick, isSelected = false, onPress, onOpen, isPinned = false, onTogglePin, onDelete, onDuplicate }: NoteCardProps) {
  const titleFont = useTitleFont();
  const { isTouchDevice, isIOS } = useIsTouchDevice();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const isChecklist = 'note_type' in note && note.note_type === 'checklist';

  // Load checklist items for checklist notes - with delay to prevent thundering herd
  useEffect(() => {
    if (!isChecklist) return;
    
    // Small staggered delay based on note id to prevent all cards querying at once
    const delay = Math.random() * 200;
    const timeoutId = setTimeout(() => {
      supabase
        .from('checklist_items')
        .select('*')
        .eq('note_id', note.id)
        .order('position', { ascending: true })
        .limit(5)
        .then(({ data }) => {
          if (data) setChecklistItems(data as ChecklistItem[]);
        });
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [note.id, isChecklist]);

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
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n+/g, ' ')
        .replace(/\r+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
    : 'No content';

  const truncatedContent = contentPreview.length > 120
    ? contentPreview.substring(0, 120) + '...'
    : contentPreview;

  return (
    <Card
      className={`
        h-full cursor-pointer group relative overflow-hidden
        bg-card/80 backdrop-blur-sm
        border transition-all duration-350 ease-bounce-out
        ${isPinned ? 'border-accent' : 'border-border/50'}
        ${!isTouchDevice ? 'hover:border-accent/30 hover:shadow-elevated hover:-translate-y-1' : ''}
        ${isSelected ? 'ring-2 ring-accent/30 border-accent/40' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        if (isIOS) {
          // iOS: Always open immediately to avoid triple tap issues
          onOpen?.(note);
        } else if (isTouchDevice && isSelected) {
          // Android/Other touch devices: Second tap opens note
          onOpen?.(note);
        } else {
          // First tap on touch devices, or any tap on non-touch devices
          onPress?.(note);
          if (!isTouchDevice) {
            // On non-touch devices, open immediately
            onOpen?.(note);
          }
        }
      }}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Pin button in top right corner */}
      <Button
        variant="secondary"
        size="sm"
        className={`
          absolute top-3 right-3 h-8 w-8 rounded-full p-0 z-10
          bg-secondary/80 backdrop-blur-sm border border-border/50
          transition-all duration-250 ease-bounce-out
          ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
          ${isPinned ? 'text-accent border-accent/30 bg-accent/10' : ''}
          hover:scale-105 hover:shadow-sm
        `}
        aria-label={isPinned ? 'Unpin note' : 'Pin note'}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin?.(note);
        }}
      >
        <Pin className="h-4 w-4" fill={isPinned ? "currentColor" : "none"} />
      </Button>

      {/* Duplicate button */}
      {onDuplicate && (
        <Button
          variant="ghost"
          size="sm"
          className={`
            absolute top-3 right-12 h-8 w-8 rounded-full p-0 z-10
            bg-secondary/60 backdrop-blur-sm border border-border/50
            hover:bg-accent/10 hover:border-accent/30
            transition-all duration-250 ease-bounce-out
            ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
            hover:scale-105
          `}
          aria-label="Duplicate note"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(note);
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}

      {/* Delete button */}
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`
                absolute top-3 h-8 w-8 rounded-full p-0 z-10
                bg-secondary/60 backdrop-blur-sm border border-border/50
                hover:bg-destructive/10 hover:border-destructive/30
                transition-all duration-250 ease-bounce-out
                ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
                hover:scale-105
              `}
              style={{ right: onDuplicate ? '5.25rem' : '3rem' }}
              aria-label="Delete note"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Delete Note Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Share button */}
      {onShareClick && (
        <Button
          variant="ghost"
          size="sm"
          className={`
            absolute bottom-3 right-12 h-7 w-7 rounded-full p-0 z-10
            bg-secondary/60 backdrop-blur-sm border border-border/50
            hover:bg-accent/10 hover:border-accent/30
            transition-all duration-250 ease-bounce-out
            ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
            hover:scale-105
          `}
          onClick={(e) => {
            e.stopPropagation();
            onShareClick(note);
          }}
        >
          <Users className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Quick open arrow */}
      <Button
        variant="secondary"
        size="sm"
        className={`
          absolute bottom-3 right-3 h-7 w-7 rounded-full p-0 z-10
          bg-accent/10 backdrop-blur-sm border border-accent/20
          text-accent hover:bg-accent hover:text-accent-foreground
          transition-all duration-250 ease-bounce-out
          ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
          hover:scale-105 hover:shadow-glow-sm
        `}
        aria-label="Open note"
        onClick={(e) => {
          e.stopPropagation();
          onOpen?.(note);
        }}
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Button>

      <CardContent className={`p-5 transition-all duration-300 ${!isTouchDevice ? 'group-hover:translate-y-[-1px]' : ''} select-none relative`}>
        {/* Shared note tags at top of content */}
        {isSharedWithUser && (
          <Badge
            variant="secondary"
            className="h-6 px-2.5 text-xs flex items-center gap-1.5 mb-3 w-fit rounded-full bg-accent/10 text-accent border-accent/20"
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
            className="h-6 px-2.5 text-xs flex items-center gap-1.5 mb-3 w-fit rounded-full bg-accent/10 text-accent border-accent/20"
          >
            <Users className="h-3 w-3" />
            I Shared
          </Badge>
        )}

        <div className="flex items-center gap-2 mb-3 pr-8">
          {('note_type' in note && note.note_type === 'checklist') && (
            <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <h3 className={`
            font-display font-medium text-lg
            break-words overflow-wrap-anywhere leading-tight
            text-foreground transition-colors duration-300
            dynamic-title-font
            ${!isTouchDevice ? 'group-hover:text-accent' : ''}
          `}>
            {note.title || (('note_type' in note && note.note_type === 'checklist') ? "Untitled Checklist" : "Untitled Note")}
          </h3>
        </div>

        {isChecklist ? (
          <div className="space-y-1.5">
            {checklistItems.length > 0 ? (
              checklistItems.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  {item.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                  )}
                  <span className={`truncate ${item.completed ? 'line-through text-muted-foreground/60' : 'text-muted-foreground'}`}>
                    {item.content || 'Empty item'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground/60 italic">No items yet</p>
            )}
            {checklistItems.length > 4 && (
              <p className="text-xs text-muted-foreground/50">+{checklistItems.length - 4} more items</p>
            )}
          </div>
        ) : (
          <p className={`
            text-sm text-muted-foreground line-clamp-4
            ${!isTouchDevice ? 'group-hover:text-foreground/80' : ''}
            transition-colors duration-300 leading-relaxed
          `}>
            {truncatedContent}
          </p>
        )}
      </CardContent>

      <CardFooter className={`
        px-5 pb-5 pt-0 text-xs text-muted-foreground/80
        transition-all duration-300
        ${!isTouchDevice ? 'group-hover:text-muted-foreground' : ''}
      `}>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </span>
      </CardFooter>
    </Card>
  );
}
