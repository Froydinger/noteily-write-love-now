import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type ThemeType = 'light' | 'dark' | 'navy' | 'sepia';

interface UserPreferences {
  theme: ThemeType;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  updateTheme: (theme: ThemeType) => Promise<void>;
  loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({ theme: 'navy' });
  const [loading, setLoading] = useState(true);

  // Load user preferences from Supabase
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        // Not authenticated - use default navy theme
        setPreferences({ theme: 'navy' });
        applyTheme('navy');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // Error other than "not found"
          console.error('Error loading preferences:', error);
          setPreferences({ theme: 'navy' });
          applyTheme('navy');
        } else if (data) {
          // Preferences found
          setPreferences({ theme: data.theme as ThemeType });
          applyTheme(data.theme as ThemeType);
        } else {
          // No preferences found - create default
          await createDefaultPreferences();
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setPreferences({ theme: 'navy' });
        applyTheme('navy');
      }

      setLoading(false);
    };

    loadPreferences();
  }, [user]);

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          theme: 'navy'
        });

      if (error) {
        console.error('Error creating default preferences:', error);
      }

      setPreferences({ theme: 'navy' });
      applyTheme('navy');
    } catch (error) {
      console.error('Error creating default preferences:', error);
      setPreferences({ theme: 'navy' });
      applyTheme('navy');
    }
  };

  const updateTheme = async (newTheme: ThemeType) => {
    // Update local state immediately for responsive UI
    setPreferences(prev => ({ ...prev, theme: newTheme }));
    applyTheme(newTheme);

    if (!user) {
      // For non-authenticated users, only update local state
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ theme: newTheme })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating theme preference:', error);
        // Revert local state on error
        setPreferences(prev => ({ ...prev, theme: preferences.theme }));
        applyTheme(preferences.theme);
      }
    } catch (error) {
      console.error('Error updating theme preference:', error);
      // Revert local state on error
      setPreferences(prev => ({ ...prev, theme: preferences.theme }));
      applyTheme(preferences.theme);
    }
  };

  const applyTheme = (theme: ThemeType) => {
    const html = document.documentElement;
    
    // Remove all theme classes
    html.classList.remove('light', 'dark', 'navy', 'sepia');
    
    // Add the new theme class
    html.classList.add(theme);
    
    // Update browser theme color immediately
    updateBrowserThemeColor(theme);
  };

  const updateBrowserThemeColor = (theme: ThemeType) => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) return;

    const themeColors = {
      light: '#ffffff',
      dark: '#0a0a0a',
      navy: '#192028',
      sepia: '#f5f1eb'
    };

    metaThemeColor.setAttribute('content', themeColors[theme]);
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updateTheme, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
};