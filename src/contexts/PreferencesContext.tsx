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

  // Load user preferences - prioritize localStorage, sync with Supabase
  useEffect(() => {
    const loadPreferences = async () => {
      // Always start with localStorage as primary source
      const localTheme = (localStorage.getItem('theme') as ThemeType) || 'navy';
      setPreferences({ theme: localTheme });
      
      // Apply theme immediately if not already applied
      const html = document.documentElement;
      if (!html.classList.contains(localTheme)) {
        applyTheme(localTheme);
      } else {
        updateBrowserThemeColor(localTheme);
      }

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Try to sync with Supabase for authenticated users
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // Error other than "not found" - keep local theme
          console.error('Error loading preferences:', error);
        } else if (data) {
          // Check if Supabase theme differs from local
          if (data.theme !== localTheme) {
            // Supabase has different theme - use it and update localStorage
            setPreferences({ theme: data.theme as ThemeType });
            applyTheme(data.theme as ThemeType);
          }
        } else {
          // No preferences found in Supabase - sync local to Supabase
          await createDefaultPreferences(localTheme);
        }
      } catch (error) {
        console.error('Error syncing preferences:', error);
        // Keep local theme on error
      }

      setLoading(false);
    };

    loadPreferences();
  }, [user]);

  const createDefaultPreferences = async (theme: ThemeType = 'navy') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          theme: theme
        });

      if (error) {
        console.error('Error creating default preferences:', error);
      }
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  const updateTheme = async (newTheme: ThemeType) => {
    // Update local state immediately for responsive UI
    setPreferences(prev => ({ ...prev, theme: newTheme }));
    applyTheme(newTheme);
    
    // Update browser color when user explicitly changes theme
    updateBrowserThemeColor(newTheme);

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
    
    // Save to localStorage immediately
    localStorage.setItem('theme', theme);
    
    // Update browser theme color to match the applied theme
    updateBrowserThemeColor(theme);
  };

  const updateBrowserThemeColor = (theme: ThemeType) => {
    const themeColors = {
      light: '#ffffff',
      dark: '#0a0a0a',
      navy: '#192028',
      sepia: '#f5f1eb'
    };

    const color = themeColors[theme];

    // Update ALL possible meta tags to ensure consistency
    const metaTags = [
      document.querySelector('meta[name="theme-color"]'),
      document.getElementById('theme-meta'),
      document.querySelector('meta[name="msapplication-navbutton-color"]')
    ];

    metaTags.forEach(meta => {
      if (meta) {
        meta.setAttribute('content', color);
      }
    });

    // Create theme-color meta if missing
    if (!metaTags[0] && !metaTags[1]) {
      const newMeta = document.createElement('meta');
      newMeta.name = 'theme-color';
      newMeta.id = 'theme-meta';  // Add same ID as inline script
      newMeta.content = color;
      document.head.appendChild(newMeta);
    }

    console.log('PreferencesContext updated browser color to:', color, 'for theme:', theme);
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updateTheme, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
};