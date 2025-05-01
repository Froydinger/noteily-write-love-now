
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun } from 'lucide-react';

const SettingsPage = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    enableAutoSave: true,
    darkMode: true,
  });

  // Initialize settings
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setSettings(prev => ({
      ...prev,
      darkMode: isDarkMode
    }));
  }, []);

  const handleToggleSetting = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    // Handle theme toggle specifically
    if (setting === 'darkMode') {
      if (settings.darkMode) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    }
    
    toast({
      title: "Settings updated",
      description: `${setting} has been ${settings[setting] ? 'disabled' : 'enabled'}.`,
    });
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-8">
        {isMobile && <SidebarTrigger />}
        <h1 className="text-2xl font-serif font-medium">Settings</h1>
      </div>
      
      <div className="max-w-xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-4 font-serif">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-save">Auto Save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save notes while typing
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={settings.enableAutoSave}
                  onCheckedChange={() => handleToggleSetting('enableAutoSave')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between dark and light theme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    id="dark-mode"
                    checked={settings.darkMode}
                    onCheckedChange={() => handleToggleSetting('darkMode')}
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-4 font-serif">About Noteily</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Noteily - "Note I Love You" is a minimalist notes app focused on self-love and creative expression.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
