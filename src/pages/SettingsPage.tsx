
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

const SettingsPage = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    enableAutoSave: true
  });

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
                  onCheckedChange={() => setSettings(prev => ({ ...prev, enableAutoSave: !prev.enableAutoSave }))}
                  className="dark:data-[state=checked]:bg-neon-blue"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between dark and light theme
                  </p>
                </div>
                <ThemeToggle />
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
