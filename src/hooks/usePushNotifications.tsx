import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// VAPID public key - this should be generated with the private key
const VAPID_PUBLIC_KEY = 'BKxTz7ZjLfQF8i7XOjF9KqQK4z3rJ9t3XNj8k1j5YqGaVwXy7N8j5QFt7K4z9j8X3Y6t5N7j9Q8k1j5YqGaVwXy';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user || !isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications for important updates.",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "You can enable notifications later in your browser settings.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!user || !isSupported || permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      // Save subscription to database
      const { error } = await supabase.functions.invoke('manage-push-subscription', {
        body: {
          action: 'subscribe',
          subscription: subscriptionData,
          userId: user.id,
          deviceName: getDeviceName(),
        },
      });

      if (error) {
        throw error;
      }

      setIsSubscribed(true);
      toast({
        title: "Subscribed",
        description: "You're now subscribed to push notifications!",
      });
      return true;

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to subscribe to push notifications.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!user || !isSupported) return false;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove subscription from database
        const subscriptionData: PushSubscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!),
          },
        };

        await supabase.functions.invoke('manage-push-subscription', {
          body: {
            action: 'unsubscribe',
            subscription: subscriptionData,
            userId: user.id,
          },
        });
      }

      setIsSubscribed(false);
      toast({
        title: "Unsubscribed",
        description: "You've been unsubscribed from push notifications.",
      });
      return true;

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Unsubscribe Failed",
        description: "Failed to unsubscribe from push notifications.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS Device';
  if (/Android/.test(userAgent)) return 'Android Device';
  if (/Windows/.test(userAgent)) return 'Windows Device';
  if (/Mac/.test(userAgent)) return 'Mac Device';
  if (/Linux/.test(userAgent)) return 'Linux Device';
  return 'Unknown Device';
}