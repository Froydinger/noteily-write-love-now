
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/hooks/use-toast';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialize based on saved preference or default to dark
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'light' ? false : true; // Default to dark if not set
    setIsDarkMode(isDark);
    applyTheme(isDark);
  }, []);
  
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyTheme(newDarkMode);
    
    toast({
      title: newDarkMode ? "Dark mode enabled" : "Light mode enabled",
      description: "Theme preference has been saved.",
    });
  };
  
  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  
  return (
    <Toggle 
      aria-label="Toggle theme"
      pressed={isDarkMode}
      onPressedChange={toggleTheme}
      className="w-full justify-start text-muted-foreground gap-2" 
      variant="ghost"
      size="sm"
    >
      {isDarkMode ? (
        <>
          <Moon className="h-4 w-4" />
          <span>Switch Lights On</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          <span>Switch Lights Off</span>
        </>
      )}
    </Toggle>
  );
}
