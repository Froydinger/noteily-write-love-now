import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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

  const signIn = async (emailOrUsername: string, password: string) => {
    let email = emailOrUsername;
    
    // If it doesn't contain @, treat it as username and look up email
    if (!emailOrUsername.includes('@')) {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('user_id, users:user_id(email)')
          .eq('username', emailOrUsername.toLowerCase())
          .single();
        
        if (error || !data || !data.users) {
          toast({
            title: "Sign in failed",
            description: "Username not found",
            variant: "destructive",
          });
          return { error: { message: "Username not found" } };
        }
        
        email = (data.users as any).email;
      } catch (error) {
        toast({
          title: "Sign in failed",
          description: "Error looking up username",
          variant: "destructive",
        });
        return { error };
      }
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
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
  };

  const signUp = async (email: string, password: string) => {
    // Use current URL to preserve user's location after email confirmation
    const redirectUrl = window.location.href;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "Please check your email for a confirmation link.",
      });
    }
    
    return { error };
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