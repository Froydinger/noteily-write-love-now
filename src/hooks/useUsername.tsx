import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useUsername() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load current username
  const loadUsername = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading username:', error);
        return;
      }

      setUsername(data?.username || null);
    } catch (error) {
      console.error('Error loading username:', error);
    }
  }, [user]);

  useEffect(() => {
    loadUsername();
  }, [loadUsername]);

  // Check if username is available
  const checkUsername = useCallback(async (usernameToCheck: string): Promise<boolean> => {
    if (!usernameToCheck.trim()) return false;

    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_username_exists', {
        p_username: usernameToCheck.trim()
      });

      if (error) {
        console.error('Error checking username:', error);
        return false;
      }

      return !data; // Return true if username is available (not exists)
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  // Set username
  const setUsernameValue = useCallback(async (newUsername: string): Promise<boolean> => {
    if (!user) return false;

    // Validate username format
    const trimmedUsername = newUsername.trim().toLowerCase();
    if (!trimmedUsername) {
      toast({
        title: "Invalid username",
        description: "Username cannot be empty.",
        variant: "destructive",
      });
      return false;
    }

    if (trimmedUsername.length < 3) {
      toast({
        title: "Username too short",
        description: "Username must be at least 3 characters long.",
        variant: "destructive",
      });
      return false;
    }

    if (trimmedUsername.length > 20) {
      toast({
        title: "Username too long",
        description: "Username must be 20 characters or less.",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      toast({
        title: "Invalid username",
        description: "Username can only contain lowercase letters, numbers, and underscores.",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      // Skip availability check if it's the user's current username
      if (trimmedUsername !== username) {
        const isAvailable = await checkUsername(trimmedUsername);
        if (!isAvailable) {
          toast({
            title: "Username taken",
            description: "This username is already taken. Please choose another.",
            variant: "destructive",
          });
          return false;
        }
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ username: trimmedUsername })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setUsername(trimmedUsername);
      toast({
        title: "Username set",
        description: `Your username is now @${trimmedUsername}`,
      });
      return true;
    } catch (error: any) {
      console.error('Error setting username:', error);
      toast({
        title: "Failed to set username",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast, checkUsername]);

  // Remove username
  const removeUsername = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ username: null })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setUsername(null);
      toast({
        title: "Username removed",
        description: "Your username has been removed.",
      });
      return true;
    } catch (error: any) {
      console.error('Error removing username:', error);
      toast({
        title: "Failed to remove username",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return {
    username,
    loading,
    checking,
    checkUsername,
    setUsername: setUsernameValue,
    removeUsername,
    refreshUsername: loadUsername,
  };
}