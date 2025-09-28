import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SecureShareInfo {
  id: string;
  note_id: string;
  display_name: string;
  permission: string;
  is_registered_user: boolean;
}

export function useSecureSharedNotes(noteId: string | null) {
  const [shares, setShares] = useState<SecureShareInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShares = async () => {
    if (!noteId) {
      setShares([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Loading shares for noteId:', noteId);
      
      // First get the basic share records (which we're allowed to see via RLS)
      const { data: shareRecords, error: shareError } = await supabase
        .from('shared_notes')
        .select('id, note_id, permission, shared_with_user_id, shared_with_email, shared_with_username')
        .eq('note_id', noteId);

      console.log('Share records from DB:', shareRecords, 'Error:', shareError);

      if (shareError) throw shareError;

      // Then get the secure display info for each share
      const secureShares: SecureShareInfo[] = [];
      
      for (const share of shareRecords || []) {
        console.log('Getting display info for share:', share.id);
        
        const { data: displayInfo, error: displayError } = await supabase
          .rpc('get_shared_note_display_info', { share_id: share.id });

        console.log('Display info result:', displayInfo, 'Error:', displayError);

        if (displayError) {
          console.error('Error getting display info for share:', displayError);
          continue;
        }

        if (displayInfo && displayInfo.length > 0) {
          secureShares.push(displayInfo[0]);
        } else {
          // Fallback: create display info from share record directly
          console.log('No display info returned, using fallback for share:', share);
          secureShares.push({
            id: share.id,
            note_id: share.note_id,
            display_name: share.shared_with_username || share.shared_with_email || 'Unknown User',
            permission: share.permission,
            is_registered_user: !!share.shared_with_user_id
          });
        }
      }

      console.log('Final secure shares:', secureShares);
      setShares(secureShares);
    } catch (err: any) {
      console.error('Error loading secure shares:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, [noteId]);

  const removeShare = async (shareId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shared_notes')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      // Reload shares after successful deletion
      await loadShares();
      return true;
    } catch (err: any) {
      console.error('Error removing share:', err);
      setError(err.message);
      return false;
    }
  };

  const updateSharePermission = async (shareId: string, newPermission: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shared_notes')
        .update({ permission: newPermission })
        .eq('id', shareId);

      if (error) throw error;

      // Reload shares after successful update
      await loadShares();
      return true;
    } catch (err: any) {
      console.error('Error updating share permission:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    shares,
    loading,
    error,
    reload: loadShares,
    removeShare,
    updateSharePermission
  };
}