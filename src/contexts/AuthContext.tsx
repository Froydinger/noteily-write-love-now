import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useToast } from '@/hooks/use-toast';
import { clearAllAuthCache, clearStaleAuthCache } from '@/lib/authStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string) => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_CALLBACK_PATH = '/auth/callback';
const RESET_PASSWORD_PATH = '/reset-password';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    clearStaleAuthCache();

    const syncAuthState = (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    };

    const finishInitialization = () => {
      if (!isMounted) return;
      setInitializing(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.info('[Auth] onAuthStateChange:', event, nextSession?.user?.email ?? 'no user');
      syncAuthState(nextSession);

      if (event !== 'INITIAL_SESSION') {
        finishInitialization();
      }
    });

    const hydrateSession = async () => {
      const {
        data: { session: existingSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] getSession failed:', error.message);
      }

      syncAuthState(existingSession);
      finishInitialization();
    };

    void hydrateSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        const error = new Error('Please enter your email address.');
        toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
      }

      return { error };
    } catch (error: any) {
      toast({ title: 'Sign in failed', description: error?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);

    try {
      const normalizedEmail = normalizeEmail(email);

      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        const error = new Error('Please enter a valid email address to create your account.');
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
        },
      });

      if (error) {
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'Please check your email for a confirmation link.' });
      }

      return { error };
    } catch (error: any) {
      toast({ title: 'Sign up failed', description: error?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setLoading(true);

    try {
      const normalizedEmail = normalizeEmail(email);

      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        const error = new Error('Enter the email address for your account.');
        toast({ title: 'Password reset failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}${RESET_PASSWORD_PATH}`,
      });

      if (error) {
        toast({ title: 'Password reset failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      toast({
        title: 'Password reset sent',
        description: "If an account exists for that email, you'll receive reset instructions shortly.",
      });

      return { error: null };
    } catch (error: any) {
      toast({ title: 'Password reset failed', description: error?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
        extraParams: {
          prompt: 'select_account',
        },
      });

      if (error) {
        toast({ title: 'Google sign in failed', description: error.message, variant: 'destructive' });
      }

      return { error };
    } catch (error: any) {
      toast({ title: 'Google sign in failed', description: error?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out failed:', error);
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (globalError) {
      console.error('Sign out failed completely:', globalError);
      toast({
        title: 'Sign out failed',
        description: "There was an issue signing out, but you've been logged out locally.",
        variant: 'destructive',
      });
    } finally {
      clearAllAuthCache();
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        initializing,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        requestPasswordReset,
      }}
    >
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
