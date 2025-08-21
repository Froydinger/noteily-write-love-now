import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  user_id: string;
  email: string;
  username: string | null;
  has_google_auth: boolean;
}

export function useUsernameAuth() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  // Check if username or email exists
  const checkIdentifierExists = useCallback(async (identifier: string): Promise<boolean> => {
    if (!identifier || identifier.trim().length === 0) return false;
    
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_identifier_exists', {
        p_identifier: identifier.trim()
      });
      
      if (error) {
        console.error('Error checking identifier:', error);
        return false;
      }
      
      return data;
    } catch (error) {
      console.error('Error checking identifier:', error);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  // Get user data by username or email
  const getUserByIdentifier = useCallback(async (identifier: string): Promise<UserData | null> => {
    if (!identifier || identifier.trim().length === 0) return null;
    
    try {
      const { data, error } = await supabase.rpc('get_user_by_identifier', {
        p_identifier: identifier.trim()
      });
      
      if (error) {
        console.error('Error getting user:', error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }, []);

  // Check if user is Google OAuth user
  const checkIsGoogleUser = useCallback(async (identifier: string): Promise<boolean> => {
    if (!identifier || identifier.trim().length === 0) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_google_user', {
        p_identifier: identifier.trim()
      });
      
      if (error) {
        console.error('Error checking Google user:', error);
        return false;
      }
      
      return data;
    } catch (error) {
      console.error('Error checking Google user:', error);
      return false;
    }
  }, []);

  // Sign in with username/email and password
  const signInWithIdentifier = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    try {
      // First check if it's a Google user
      const isGoogle = await checkIsGoogleUser(identifier);
      if (isGoogle) {
        return { 
          error: { 
            message: 'This account uses Google sign-in. Please use the "Continue with Google" button instead.' 
          } 
        };
      }

      // Get user data to find their email
      const userData = await getUserByIdentifier(identifier);
      if (!userData) {
        return { error: { message: 'No account found with this username or email.' } };
      }

      // Sign in with email (Supabase only accepts email for sign in)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });

      return { data, error };
    } catch (error: any) {
      return { error };
    } finally {
      setLoading(false);
    }
  }, [checkIsGoogleUser, getUserByIdentifier]);

  // Sign up with username, optional email, and password
  const signUpWithUsername = useCallback(async (
    username: string, 
    password: string, 
    email?: string
  ) => {
    setLoading(true);
    try {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return { 
          error: { 
            message: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens.' 
          } 
        };
      }

      // Check if username already exists
      const exists = await checkIdentifierExists(username);
      if (exists) {
        return { error: { message: 'This username is already taken.' } };
      }

      // For signup, we need an email. If not provided, create a temporary one
      const signupEmail = email || `${username.toLowerCase()}@temp.noteily.app`;
      
      // Check if email is already taken (if provided)
      if (email) {
        const emailExists = await checkIdentifierExists(email);
        if (emailExists) {
          return { error: { message: 'An account with this email already exists.' } };
        }
      }

      const redirectUrl = `${window.location.origin}/`;
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username.toLowerCase(),
            preferred_email: email || null
          }
        }
      });

      if (error) return { error };

      // If successful and user is created, update their preferences
      if (data.user) {
        // Create or update user preferences with username
        const { error: prefError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: data.user.id,
            username: username.toLowerCase(),
            email: email || null
          });

        if (prefError) {
          console.error('Error setting user preferences:', prefError);
        }
      }

      return { data, error };
    } catch (error: any) {
      return { error };
    } finally {
      setLoading(false);
    }
  }, [checkIdentifierExists]);

  // Request password reset
  const requestPasswordReset = useCallback(async (identifier: string) => {
    setLoading(true);
    try {
      // Check if it's a Google user
      const isGoogle = await checkIsGoogleUser(identifier);
      if (isGoogle) {
        return { 
          error: { 
            message: 'This account uses Google sign-in. You cannot reset the password for Google accounts. Please use "Continue with Google" to sign in.' 
          } 
        };
      }

      // Get user data to find their email
      const userData = await getUserByIdentifier(identifier);
      if (!userData) {
        return { error: { message: 'No account found with this username or email.' } };
      }

      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(userData.email, {
        redirectTo: redirectUrl
      });

      return { error };
    } catch (error: any) {
      return { error };
    } finally {
      setLoading(false);
    }
  }, [checkIsGoogleUser, getUserByIdentifier]);

  return {
    loading,
    checking,
    checkIdentifierExists,
    getUserByIdentifier,
    checkIsGoogleUser,
    signInWithIdentifier,
    signUpWithUsername,
    requestPasswordReset
  };
}