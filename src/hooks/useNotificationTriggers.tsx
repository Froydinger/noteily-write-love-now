import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useNotificationTriggers() {
  const { user } = useAuth();

  const triggerNoteSharedNotification = async (
    noteId: string,
    sharedWithUserId: string,
    noteTitle: string
  ) => {
    if (!user) return;

    try {
      await supabase.functions.invoke('trigger-share-notification', {
        body: {
          noteId,
          sharedWithUserId,
          ownerEmail: user.email,
          noteTitle
        }
      });
    } catch (error) {
      console.error('Failed to trigger share notification:', error);
    }
  };

  const triggerNoteUpdatedNotification = async (
    noteId: string,
    noteTitle: string,
    updaterEmail: string
  ) => {
    if (!user) return;

    try {
      // Get all users who have access to this note (except the updater)
      const { data: sharedNotes, error } = await supabase
        .from('shared_notes')
        .select('shared_with_user_id, owner_id')
        .eq('note_id', noteId);

      if (error || !sharedNotes) return;

      // Collect all user IDs who should be notified
      const userIds = new Set<string>();
      sharedNotes.forEach(share => {
        if (share.shared_with_user_id && share.shared_with_user_id !== user.id) {
          userIds.add(share.shared_with_user_id);
        }
        if (share.owner_id !== user.id) {
          userIds.add(share.owner_id);
        }
      });

      // Send notifications to each user
      for (const userId of userIds) {
        await supabase.functions.invoke('push-notifications', {
          body: {
            type: 'note_updated',
            userId,
            noteId,
            payload: {
              title: 'Note Updated',
              body: `${updaterEmail} updated "${noteTitle}"`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              data: {
                type: 'note_updated',
                noteId,
                url: `/note/${noteId}`
              },
              actions: [
                {
                  action: 'view',
                  title: 'View Changes',
                  icon: '/icon-192.png'
                }
              ]
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger note updated notification:', error);
    }
  };

  return {
    triggerNoteSharedNotification,
    triggerNoteUpdatedNotification,
  };
}