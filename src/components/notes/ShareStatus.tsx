import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Edit, Lock } from 'lucide-react';
import type { NoteWithSharing } from '@/types/sharing';

interface ShareStatusProps {
  note: NoteWithSharing;
  showText?: boolean;
}

export function ShareStatus({ note, showText = true }: ShareStatusProps) {
  // If user owns this note and it's shared with others, show "Shared" badge
  if (note.isOwnedByUser && note.shares && note.shares.length > 0) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        {showText && `Shared with ${note.shares.length}`}
      </Badge>
    );
  }

  // If this note is shared with the user (they don't own it), show shared status
  if (note.isSharedWithUser && !note.isOwnedByUser) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        {note.userPermission === 'read' ? (
          <>
            <Eye className="h-3 w-3" />
            {showText && "Shared (View Only)"}
          </>
        ) : (
          <>
            <Edit className="h-3 w-3" />
            {showText && "Shared (Can Edit)"}
          </>
        )}
      </Badge>
    );
  }

  // User owns this note and it's not shared with anyone
  return null;
}

interface SharePermissionIconProps {
  permission: 'read' | 'write';
  className?: string;
}

export function SharePermissionIcon({ permission, className = "h-4 w-4" }: SharePermissionIconProps) {
  if (permission === 'read') {
    return <Eye className={className} />;
  }
  return <Edit className={className} />;
}

interface ShareStatusTextProps {
  permission: 'read' | 'write';
}

export function ShareStatusText({ permission }: ShareStatusTextProps) {
  return permission === 'read' ? 'View Only' : 'Can Edit';
}