import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type ThemeType = 'light' | 'dark' | 'navy';
export type TitleFontType = 'serif' | 'sans' | 'mono';

interface UserPreferences {
  theme: ThemeType;
  titleFont: TitleFontType;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  updateTheme: (theme: ThemeType) => Promise<void>;
  updateTitleFont: (font: TitleFontType) => Promise<void>;
  refreshPreferences: () => Promise<void>;
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
  const [preferences, setPreferences] = useState<UserPreferences>({ theme: 'navy', titleFont: 'serif' });
  const [loading, setLoading] = useState(false);

  // Load user preferences - prioritize localStorage, sync with Supabase
  const loadPreferences = async () => {
    // Always start with localStorage as primary source
    const localTheme = (localStorage.getItem('theme') as ThemeType) || 'navy';
    const localTitleFont = (localStorage.getItem('titleFont') as TitleFontType) || 'serif';
    setPreferences({ theme: localTheme, titleFont: localTitleFont });
    
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
        .select('theme, title_font')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Error other than "not found" - keep local theme
        console.error('Error loading preferences:', error);
      } else if (data) {
        // Check if Supabase data differs from local
        const supabaseTitleFont = (data.title_font as TitleFontType) || 'serif';
        if (data.theme !== localTheme || supabaseTitleFont !== localTitleFont) {
          // Supabase has different preferences - use them and update localStorage
          setPreferences({ theme: data.theme as ThemeType, titleFont: supabaseTitleFont });
          applyTheme(data.theme as ThemeType);
          applyTitleFont(supabaseTitleFont);
        }
      } else {
        // No preferences found in Supabase - sync local to Supabase
        await createDefaultPreferences(localTheme, localTitleFont);
      }
    } catch (error) {
      console.error('Error syncing preferences:', error);
      // Keep local theme on error
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPreferences();

    // Listen for sync events from NoteContext
    const handleRefreshPreferences = () => {
      loadPreferences();
    };

    window.addEventListener('refresh-preferences', handleRefreshPreferences);
    
    return () => {
      window.removeEventListener('refresh-preferences', handleRefreshPreferences);
    };
  }, [user]);

  const createDefaultPreferences = async (theme: ThemeType = 'navy', titleFont: TitleFontType = 'serif') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          theme: theme,
          title_font: titleFont
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

  const updateTitleFont = async (newTitleFont: TitleFontType) => {
    // Update local state immediately for responsive UI
    setPreferences(prev => ({ ...prev, titleFont: newTitleFont }));
    applyTitleFont(newTitleFont);

    if (!user) {
      // For non-authenticated users, only update local state
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ title_font: newTitleFont })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating title font preference:', error);
        // Revert local state on error
        setPreferences(prev => ({ ...prev, titleFont: preferences.titleFont }));
        applyTitleFont(preferences.titleFont);
      }
    } catch (error) {
      console.error('Error updating title font preference:', error);
      // Revert local state on error
      setPreferences(prev => ({ ...prev, titleFont: preferences.titleFont }));
      applyTitleFont(preferences.titleFont);
    }
  };

  const refreshPreferences = async () => {
    if (!user) return;
    await loadPreferences();
  };

  const applyTheme = (theme: ThemeType) => {
    const html = document.documentElement;
    
    // Remove all theme classes
    html.classList.remove('light', 'dark', 'navy');
    
    // Add the new theme class
    html.classList.add(theme);
    
    // Save to localStorage immediately
    localStorage.setItem('theme', theme);
    
    // Update browser theme color to match the applied theme
    updateBrowserThemeColor(theme);
  };

  const applyTitleFont = (titleFont: TitleFontType) => {
    // Save to localStorage immediately
    localStorage.setItem('titleFont', titleFont);
    
    // Apply the font preference to the document
    document.documentElement.setAttribute('data-title-font', titleFont);
  };

  const updateBrowserThemeColor = (theme: ThemeType) => {
    const themeColors = {
      light: '#ffffff',
      dark: '#0a0a0a',
      navy: '#192028'
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

  // Apply title font on mount
  useEffect(() => {
    applyTitleFont(preferences.titleFont);
  }, [preferences.titleFont]);

  return (
    <PreferencesContext.Provider value={{ preferences, updateTheme, updateTitleFont, refreshPreferences, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
};