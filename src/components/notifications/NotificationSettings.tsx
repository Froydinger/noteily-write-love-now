import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone, Clock } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  notification_daily_prompt: boolean;
  notification_note_shared: boolean;
  notification_note_updated: boolean;
  daily_prompt_time: string;
}

export function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notification_daily_prompt: true,
    notification_note_shared: true,
    notification_note_updated: true,
    daily_prompt_time: '09:00:00',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_daily_prompt, notification_note_shared, notification_note_updated, daily_prompt_time')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error loading notification preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          notification_daily_prompt: data.notification_daily_prompt ?? true,
          notification_note_shared: data.notification_note_shared ?? true,
          notification_note_updated: data.notification_note_updated ?? true,
          daily_prompt_time: data.daily_prompt_time ?? '09:00:00',
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ [key]: value })
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setPreferences(prev => ({ ...prev, [key]: value }));
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500"><Bell className="w-3 h-3 mr-1" />Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive"><BellOff className="w-3 h-3 mr-1" />Blocked</Badge>;
      default:
        return <Badge variant="secondary"><Bell className="w-3 h-3 mr-1" />Not Set</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about important updates and reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notification Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Device Notifications</div>
              <div className="text-sm text-muted-foreground">
                Status: {getPermissionBadge()}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isSubscribed ? (
              <Button 
                variant="outline" 
                onClick={unsubscribe}
                disabled={loading}
              >
                {loading ? 'Unsubscribing...' : 'Unsubscribe'}
              </Button>
            ) : (
              <Button 
                onClick={subscribe}
                disabled={loading || permission === 'denied'}
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        {isSubscribed && (
          <div className="space-y-4">
            <h4 className="font-medium">Notification Types</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="note-shared">Note Sharing</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified when someone shares a note with you
                  </div>
                </div>
                <Switch
                  id="note-shared"
                  checked={preferences.notification_note_shared}
                  onCheckedChange={(checked) => 
                    updatePreference('notification_note_shared', checked)
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="note-updated">Note Updates</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified when shared notes are updated
                  </div>
                </div>
                <Switch
                  id="note-updated"
                  checked={preferences.notification_note_updated}
                  onCheckedChange={(checked) => 
                    updatePreference('notification_note_updated', checked)
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-prompt" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Daily Writing Prompts
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Get daily writing inspiration at {preferences.daily_prompt_time.slice(0, 5)}
                  </div>
                </div>
                <Switch
                  id="daily-prompt"
                  checked={preferences.notification_daily_prompt}
                  onCheckedChange={(checked) => 
                    updatePreference('notification_daily_prompt', checked)
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        )}

        {permission === 'denied' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Notifications Blocked:</strong> To receive push notifications, please enable them in your browser settings and refresh the page.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}