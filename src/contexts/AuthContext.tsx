import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, password: string, email?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (identifier: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is Google OAuth user first
  const checkIsGoogleUser = async (identifier: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_google_user', {
        p_identifier: identifier.trim()
      });
      return data || false;
    } catch (error) {
      return false;
    }
  };

  // Get user data by identifier
  const getUserByIdentifier = async (identifier: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_by_identifier', {
        p_identifier: identifier.trim()
      });
      return data?.[0] || null;
    } catch (error) {
      return null;
    }
  };

  const signIn = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      // Clean the identifier input
      const cleanIdentifier = identifier.trim();
      
      // First check if it's a Google user
      const isGoogle = await checkIsGoogleUser(cleanIdentifier);
      if (isGoogle) {
        toast({
          title: "Sign in failed",
          description: "This account uses Google sign-in. Please use the 'Continue with Google' button instead.",
          variant: "destructive",
        });
        return { error: { message: 'This account uses Google sign-in. Please use the "Continue with Google" button instead.' } };
      }

      // Get user data to find their email
      const userData = await getUserByIdentifier(cleanIdentifier);
      if (!userData) {
        toast({
          title: "Sign in failed",
          description: "No account found with this username or email.",
          variant: "destructive",
        });
        return { error: { message: 'No account found with this username or email.' } };
      }

      // Sign in with email (Supabase only accepts email for sign in)
      const { error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, password: string, email?: string) => {
    setLoading(true);
    try {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(username)) {
        const error = { message: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens.' };
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Check if username already exists
      const { data: exists } = await supabase.rpc('check_identifier_exists', {
        p_identifier: username.toLowerCase()
      });
      
      if (exists) {
        const error = { message: 'This username is already taken.' };
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // For signup, we need an email. If not provided, create a temporary one
      const signupEmail = email || `${username.toLowerCase()}@temp.noteily.app`;
      
      // Check if email is already taken (if provided)
      if (email) {
        const { data: emailExists } = await supabase.rpc('check_identifier_exists', {
          p_identifier: email
        });
        if (emailExists) {
          const error = { message: 'An account with this email already exists.' };
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
          return { error };
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

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

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

      if (!email) {
        toast({
          title: "Account created!",
          description: "Your account has been created successfully. You can now sign in.",
        });
      } else {
        toast({
          title: "Check your email",
          description: "Please check your email for a confirmation link.",
        });
      }

      return { data, error };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (identifier: string) => {
    setLoading(true);
    try {
      // Clean the identifier input
      const cleanIdentifier = identifier.trim();
      
      // Check if it's a Google user
      const isGoogle = await checkIsGoogleUser(cleanIdentifier);
      if (isGoogle) {
        const error = { message: 'This account uses Google sign-in. You cannot reset the password for Google accounts.' };
        return { error };
      }

      // Get user data to find their email
      const userData = await getUserByIdentifier(cleanIdentifier);
      if (!userData) {
        const error = { message: 'No account found with this username or email.' };
        return { error };
      }

      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(userData.email, {
        redirectTo: redirectUrl
      });

      if (error) {
        return { error };
      } else {
        toast({
          title: "Password reset sent",
          description: "Check your email for password reset instructions.",
        });
      }

      return { error };
    } catch (error: any) {
      const errorMessage = 'Failed to send password reset email. Please try again.';
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    
    if (error) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    try {
      // First attempt normal sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Initial sign out failed:', error);
        
        // If normal sign out fails, force clear the session
        try {
          // Force sign out with scope 'local' to clear just this browser
          await supabase.auth.signOut({ scope: 'local' });
        } catch (forceError) {
          console.error('Force sign out also failed:', forceError);
        }
      }
      
      // Always clear local state regardless of API response
      setSession(null);
      setUser(null);
      
      // Clear any auth-related localStorage items
      try {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || 
          key.includes('supabase') || 
          key.includes('auth')
        );
        authKeys.forEach(key => localStorage.removeItem(key));
      } catch (storageError) {
        console.error('Error clearing auth storage:', storageError);
      }
      
      console.log('Sign out completed successfully');
      
    } catch (globalError) {
      console.error('Sign out failed completely:', globalError);
      
      // Even if everything fails, clear local state
      setSession(null);
      setUser(null);
      
      toast({
        title: "Sign out failed",
        description: "There was an issue signing out, but you've been logged out locally.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      requestPasswordReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};