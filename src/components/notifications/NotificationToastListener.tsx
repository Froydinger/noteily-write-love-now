import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Bell, Share2, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationToastListener = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const lastNotificationId = useRef<string | null>(null);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'note_shared':
        return '🔗';
      case 'note_updated':
        return '✏️';
      default:
        return '🔔';
    }
  };

  const handleToastClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notification-toasts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Prevent duplicate toasts for the same notification
          if (lastNotificationId.current === notification.id) {
            return;
          }
          lastNotificationId.current = notification.id;

          // Show toast notification
          toast({
            title: `${getNotificationIcon(notification.type)} ${notification.title}`,
            description: notification.message,
            duration: 1, // 1ms - immediately start dismissing for continuous slide animation
            action: notification.note_id ? (
              <button
                onClick={() => handleToastClick(notification.note_id)}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                View →
              </button>
            ) : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, navigate]);

  return null; // This is an invisible component that just listens
};