export interface SharedNote {
  id: string;
  note_id: string;
  owner_id: string;
  shared_with_email: string;
  shared_with_user_id: string | null;
  shared_with_username?: string | null; // Add username field for display
  permission: 'read' | 'write';
  created_at: string;
  updated_at: string;
}

export interface NoteWithSharing {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  featured_image?: string;
  user_id: string;
  pinned: boolean; // Add pinned field
  
  // Sharing properties
  isOwnedByUser: boolean;
  isSharedWithUser: boolean;
  userPermission?: 'read' | 'write';
  shares?: SharedNote[]; // For owned notes, list of who it's shared with
  
  // Soft delete property
  deleted_at?: string | null;
}

export interface ShareRequest {
  noteId: string;
  emailOrUsername: string;
  permission: 'read' | 'write';
}

export interface ShareUpdateRequest {
  shareId: string;
  permission: 'read' | 'write';
}

export interface ShareDeleteRequest {
  shareId: string;
}