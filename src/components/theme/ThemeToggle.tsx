import { Sun, Moon, Waves, FileText, Monitor } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/hooks/use-toast';
import { usePreferences, ThemeType } from '@/contexts/PreferencesContext';

interface ThemeToggleProps {
  variant?: 'sidebar' | 'settings';
}

export default function ThemeToggle({ variant = 'sidebar' }: ThemeToggleProps) {
  const { preferences, updateTheme } = usePreferences();
  const { toast } = useToast();
  
  const toggleTheme = async () => {
    const themeOrder: ThemeType[] = ['navy', 'dark', 'light', 'sepia'];
    const currentIndex = themeOrder.indexOf(preferences.theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    
    await updateTheme(nextTheme);
    
    const themeLabels = {
      light: "Light mode enabled",
      dark: "Dark mode enabled", 
      navy: "Night Mode enabled",
      sepia: "Fresh Page enabled"
    };
    
    toast({
      title: themeLabels[nextTheme],
      description: "Theme preference has been saved.",
    });
  };
  
  const getThemeIcon = () => {
    switch (preferences.theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Monitor className="h-4 w-4" />;
      case 'navy':
        return <Moon className="h-4 w-4" />;
      case 'sepia':
        return <FileText className="h-4 w-4 text-amber-600" />;
      default:
        return <Moon className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (preferences.theme) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'navy':
        return 'Night Mode';
      case 'sepia':
        return 'Fresh Page';
      default:
        return 'Night Mode';
    }
  };

  if (variant === 'settings') {
    return (
      <Toggle 
        aria-label="Toggle theme"
        pressed={preferences.theme !== 'light'}
        onPressedChange={toggleTheme}
        className="h-8 w-8 p-0 flex-shrink-0"
        variant="outline"
        size="sm"
      >
        {getThemeIcon()}
      </Toggle>
    );
  }

  return (
    <Toggle 
      aria-label="Toggle theme"
      pressed={preferences.theme !== 'light'}
      onPressedChange={toggleTheme}
      className="w-full justify-start btn-accessible h-9"
      variant="default"
      size="sm"
    >
      {getThemeIcon()}
      <span className="ml-2">{getThemeLabel()}</span>
    </Toggle>
  );
}