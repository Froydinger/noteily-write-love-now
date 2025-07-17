
import { useState, useEffect } from 'react';
import { Sun, Moon, Waves, FileText } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark' | 'navy' | 'sepia';

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('navy'); // Default to navy mode (Night Mode)
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialize based on saved preference or default to navy
    const savedTheme = localStorage.getItem('theme') as Theme;
    const theme = savedTheme || 'navy';
    setCurrentTheme(theme);
    applyTheme(theme);
  }, []);
  
  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'navy', 'sepia'];
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
    
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
  
  const applyTheme = (theme: Theme) => {
    document.documentElement.classList.remove('dark', 'navy', 'sepia');
    if (theme !== 'light') {
      document.documentElement.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  };
  
  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4 text-neon-blue" />;
      case 'navy':
        return <Waves className="h-4 w-4 text-accent" />;
      case 'sepia':
        return <FileText className="h-4 w-4 text-amber-600" />;
      default:
        return <Waves className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (currentTheme) {
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

  return (
    <Toggle 
      aria-label="Toggle theme"
      pressed={currentTheme !== 'light'}
      onPressedChange={toggleTheme}
      className="w-full justify-start text-muted-foreground gap-2 dark:hover:bg-secondary/30 navy:hover:bg-secondary/30 sepia:hover:bg-secondary/30 dark:data-[state=on]:shadow-neon-blue-sm navy:data-[state=on]:shadow-neon-blue-sm sepia:data-[state=on]:shadow-amber-sm"
      variant="outline"
      size="sm"
    >
      {getThemeIcon()}
      <span>{getThemeLabel()}</span>
    </Toggle>
  );
}
