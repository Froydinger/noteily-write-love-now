import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Clock, Settings2 } from 'lucide-react';

interface EmailNotificationPreferences {
  email_notifications_enabled: boolean;
  notification_note_shared: boolean;
  notification_note_updated: boolean;
  notification_daily_prompt: boolean;
  daily_prompt_time: string;
  email_digest_frequency: string;
}

export function EmailNotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<EmailNotificationPreferences>({
    email_notifications_enabled: true,
    notification_note_shared: true,
    notification_note_updated: true,
    notification_daily_prompt: true,
    daily_prompt_time: '09:00',
    email_digest_frequency: 'daily'
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          email_notifications_enabled: data.email_notifications_enabled ?? true,
          notification_note_shared: data.notification_note_shared ?? true,
          notification_note_updated: data.notification_note_updated ?? true,
          notification_daily_prompt: data.notification_daily_prompt ?? true,
          daily_prompt_time: data.daily_prompt_time || '09:00',
          email_digest_frequency: data.email_digest_frequency || 'daily'
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof EmailNotificationPreferences, value: boolean | string) => {
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          [key]: value,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      setPreferences(prev => ({ ...prev, [key]: value }));

      toast({
        title: "Settings updated",
        description: "Your email notification preferences have been saved.",
      });
    } catch (error: any) {
      console.error('Error updating preference:', error);
      toast({
        title: "Error updating settings",
        description: error.message || "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-card rounded-lg p-4 border">
        <h3 className="text-lg font-medium mb-3">Email Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your email notification preferences.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4 border">
        <h3 className="text-lg font-medium mb-3">Email Notifications</h3>
        <p className="text-sm text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 border">
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
        <Mail className="h-5 w-5" />
        Email Notifications
      </h3>
      
      <div className="space-y-4">
        {/* Master toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="email-enabled" className="text-sm font-medium">
              Enable Email Notifications
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Master switch for all email notifications
            </p>
          </div>
          <Switch
            id="email-enabled"
            checked={preferences.email_notifications_enabled}
            onCheckedChange={(checked) => updatePreference('email_notifications_enabled', checked)}
            disabled={updating}
          />
        </div>

        {/* Individual notification types - only show if email notifications are enabled */}
        {preferences.email_notifications_enabled && (
          <div className="space-y-3 pl-2 border-l-2 border-muted">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="note-shared" className="text-sm font-medium">
                  Note Sharing
                </Label>
                <p className="text-xs text-muted-foreground">
                  When someone shares a note with you
                </p>
              </div>
              <Switch
                id="note-shared"
                checked={preferences.notification_note_shared}
                onCheckedChange={(checked) => updatePreference('notification_note_shared', checked)}
                disabled={updating}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="note-updated" className="text-sm font-medium">
                  Note Updates
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a shared note is updated
                </p>
              </div>
              <Switch
                id="note-updated"
                checked={preferences.notification_note_updated}
                onCheckedChange={(checked) => updatePreference('notification_note_updated', checked)}
                disabled={updating}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="daily-prompt" className="text-sm font-medium">
                  Daily Prompts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Daily writing prompts (coming soon)
                </p>
              </div>
              <Switch
                id="daily-prompt"
                checked={preferences.notification_daily_prompt}
                onCheckedChange={(checked) => updatePreference('notification_daily_prompt', checked)}
                disabled={updating}
              />
            </div>

            {preferences.notification_daily_prompt && (
              <div className="ml-4 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Prompt Time
                </Label>
                <Input
                  type="time"
                  value={preferences.daily_prompt_time}
                  onChange={(e) => updatePreference('daily_prompt_time', e.target.value)}
                  className="w-32"
                  disabled={updating}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Email Frequency
              </Label>
              <Select
                value={preferences.email_digest_frequency}
                onValueChange={(value) => updatePreference('email_digest_frequency', value)}
                disabled={updating}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="never">Never (instant only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often to receive digest emails
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/30 rounded">
          <strong>Note:</strong> Email notifications are sent through Supabase's built-in email system. 
          Make sure to check your spam folder if you don't receive emails.
        </div>
      </div>
    </div>
  );
}