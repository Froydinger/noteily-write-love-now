import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENT_PROJECT_REF = 'zupjsghppxyvmgwxvycc';
const STALE_PROJECT_REF = 'viidccjyjeipulbqqwua';
const AUTH_KEY_PATTERNS = ['supabase.auth', 'sb-', CURRENT_PROJECT_REF, STALE_PROJECT_REF];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function collectMatchingStorageKeys(storage: Storage, patterns: string[]) {
  const keysToRemove: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && patterns.some((pattern) => key.includes(pattern))) {
      keysToRemove.push(key);
    }
  }
  return keysToRemove;
}

function clearStorageKeys(storage: Storage, patterns: string[]) {
  const keysToRemove = collectMatchingStorageKeys(storage, patterns);
  keysToRemove.forEach((key) => storage.removeItem(key));
  return keysToRemove.length;
}

function clearStaleAuthCache() {
  const clearedLocal = clearStorageKeys(localStorage, [STALE_PROJECT_REF]);
  const clearedSession = clearStorageKeys(sessionStorage, [STALE_PROJECT_REF]);
  if (clearedLocal || clearedSession) {
    console.info(`[Auth] Cleared stale auth cache (${clearedLocal} local, ${clearedSession} session)`);
  }
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

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.info('[Auth] onAuthStateChange:', event, nextSession?.user?.email ?? 'no user');
      syncAuthState(nextSession);
      if (isMounted && initializing) {
        setInitializing(false);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      console.info('[Auth] getSession:', nextSession?.user?.email ?? 'no session');
      syncAuthState(nextSession);
      if (isMounted) {
        setInitializing(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

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
      const normalizedEmail = email.trim().toLowerCase();

      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        const error = new Error('Please enter a valid email address to create your account.');
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        return { error };
      }

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
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
      const normalizedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Always show the same message to prevent email enumeration
      toast({
        title: 'Password reset sent',
        description: "If an account exists for that email, you'll receive reset instructions shortly.",
      });

      return { error };
    } catch (error: any) {
      toast({ title: 'Password reset failed', description: error?.message || 'An unexpected error occurred', variant: 'destructive' });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    // Don't set loading - page will redirect away
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
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out failed:', error);
        await supabase.auth.signOut({ scope: 'local' });
      }

      clearStorageKeys(localStorage, AUTH_KEY_PATTERNS);
      clearStorageKeys(sessionStorage, AUTH_KEY_PATTERNS);

      setSession(null);
      setUser(null);
    } catch (globalError) {
      console.error('Sign out failed completely:', globalError);
      setSession(null);
      setUser(null);

      toast({
        title: 'Sign out failed',
        description: "There was an issue signing out, but you've been logged out locally.",
        variant: 'destructive',
      });
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
