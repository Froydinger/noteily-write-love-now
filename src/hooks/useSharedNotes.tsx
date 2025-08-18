import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { SharedNote, ShareRequest, ShareUpdateRequest, ShareDeleteRequest } from '@/types/sharing';

export function useSharedNotes(noteId?: string) {
  const [sharedUsers, setSharedUsers] = useState<SharedNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load shares for a specific note (when user owns the note)
  const loadShares = useCallback(async (targetNoteId: string) => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shared_notes')
        .select('*')
        .eq('note_id', targetNoteId)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const shares = (data || []).map(share => ({
        ...share,
        permission: share.permission as 'read' | 'write'
      }));

      setSharedUsers(shares);
      return shares;
    } catch (error) {
      console.error('Error loading shares:', error);
      toast({
        title: "Failed to load shares",
        description: "Please try again later.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Check if current user has access to a note (either owns it or it's shared with them)
  const checkNoteAccess = useCallback(async (targetNoteId: string) => {
    if (!user) return { hasAccess: false, permission: null, isOwner: false };

    try {
      // First check if user owns the note
      const { data: ownedNote, error: ownedError } = await supabase
        .from('notes')
        .select('user_id')
        .eq('id', targetNoteId)
        .eq('user_id', user.id)
        .single();

      if (ownedNote && !ownedError) {
        return { hasAccess: true, permission: 'write' as const, isOwner: true };
      }

      // Then check if note is shared with user
      const { data: sharedNote, error: sharedError } = await supabase
        .from('shared_notes')
        .select('permission')
        .eq('note_id', targetNoteId)
        .or(`shared_with_user_id.eq.${user.id},shared_with_email.eq.${user.email}`)
        .single();

      if (sharedNote && !sharedError) {
        return { 
          hasAccess: true, 
          permission: sharedNote.permission as 'read' | 'write', 
          isOwner: false 
        };
      }

      return { hasAccess: false, permission: null, isOwner: false };
    } catch (error) {
      console.error('Error checking note access:', error);
      return { hasAccess: false, permission: null, isOwner: false };
    }
  }, [user]);

  // Add a new share
  const addShare = useCallback(async ({ noteId, emailOrUsername, permission }: ShareRequest) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Check if user owns the note
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('user_id')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single();

      if (noteError || !note) {
        return { success: false, error: 'Note not found or access denied' };
      }

      const trimmedInput = emailOrUsername.toLowerCase().trim();

      // If it's an email, check if already shared with this email
      if (trimmedInput.includes('@')) {
        const { data: existingShare } = await supabase
          .from('shared_notes')
          .select('id')
          .eq('note_id', noteId)
          .eq('shared_with_email', trimmedInput)
          .single();

        if (existingShare) {
          return { success: false, error: 'Already shared with this email' };
        }

        // Prevent sharing with self
        if (trimmedInput === user.email?.toLowerCase()) {
          return { success: false, error: 'Cannot share with yourself' };
        }
      } else {
        // For username, we need to get the email first to check for existing shares
        const { data: userPrefs } = await supabase
          .from('user_preferences')
          .select('user_id')
          .eq('username', trimmedInput)
          .single();

        if (userPrefs) {
          // Check if already shared with this user
          const { data: existingShare } = await supabase
            .from('shared_notes')
            .select('id')
            .eq('note_id', noteId)
            .eq('shared_with_user_id', userPrefs.user_id)
            .single();

          if (existingShare) {
            return { success: false, error: 'Already shared with this user' };
          }

          // Prevent sharing with self
          if (userPrefs.user_id === user.id) {
            return { success: false, error: 'Cannot share with yourself' };
          }
        }
      }

      // Create the share using the database function that handles both emails and usernames
      const { data, error } = await supabase.rpc('add_share_with_user_link', {
        p_note_id: noteId,
        p_owner_id: user.id,
        p_shared_with_email_or_username: trimmedInput,
        p_permission: permission
      });

      if (error) throw error;

      // Refresh shares list
      await loadShares(noteId);

      toast({
        title: "Note shared successfully",
        description: `Shared with ${trimmedInput}`,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error adding share:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to share note';
      toast({
        title: "Failed to share note",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, loadShares, toast]);

  // Update share permission
  const updateShare = useCallback(async ({ shareId, permission }: ShareUpdateRequest) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('shared_notes')
        .update({ permission })
        .eq('id', shareId)
        .eq('owner_id', user.id);

      if (error) throw error;

      // Update local state
      setSharedUsers(prev => prev.map(share => 
        share.id === shareId ? { ...share, permission } : share
      ));

      toast({
        title: "Permission updated",
        description: `Updated to ${permission} access`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating share:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update permission';
      toast({
        title: "Failed to update permission",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, toast]);

  // Remove a share
  const removeShare = useCallback(async ({ shareId }: ShareDeleteRequest) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('shared_notes')
        .delete()
        .eq('id', shareId)
        .eq('owner_id', user.id);

      if (error) throw error;

      // Update local state
      setSharedUsers(prev => prev.filter(share => share.id !== shareId));

      toast({
        title: "Share removed",
        description: "User access has been removed",
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing share:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove share';
      toast({
        title: "Failed to remove share",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, toast]);

  // Load shares on mount if noteId provided
  useEffect(() => {
    if (noteId && user) {
      loadShares(noteId);
    }
  }, [noteId, user, loadShares]);

  return {
    sharedUsers,
    loading,
    loadShares,
    checkNoteAccess,
    addShare,
    updateShare,
    removeShare,
  };
}