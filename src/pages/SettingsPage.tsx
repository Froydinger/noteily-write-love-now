
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, HelpCircle } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

const SettingsPage = () => {
  const [currentTheme, setCurrentTheme] = useState('navy');
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'navy';
    setCurrentTheme(savedTheme);

    // Listen for theme changes
    const handleThemeChange = (e: CustomEvent) => {
      setCurrentTheme(e.detail);
    };

    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
    };
  }, []);

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'navy': return 'Night Mode';
      case 'sepia': return 'Fresh Page';
      default: return 'Night Mode';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const faqItems = [
    {
      question: "How do I create a new note?",
      answer: "Click the '+' button or use the 'New Note' option to create a new note. Start typing immediately."
    },
    {
      question: "Are my notes saved automatically?",
      answer: "Yes, all notes are automatically saved as you type. No need to manually save."
    },
    {
      question: "Can I access my notes offline?",
      answer: "Yes, Noteily works offline. Your notes are stored locally and will sync when you're back online."
    },
    {
      question: "How do I format text in my notes?",
      answer: "Select text to see formatting options like bold, italic, and more. Use the formatting toolbar for quick styling."
    },
    {
      question: "Is my data secure and private?",
      answer: "Yes, your notes are encrypted with your unique key and stored securely. Only you can access your notes - we cannot read them, and neither can anyone else. When signed in, your encrypted notes sync across your devices."
    }
  ];

  return (
    <div className="p-3 md:p-6 animate-fade-in min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        {(isMobile || state === "collapsed") && <SidebarTrigger />}
        <h1 className="text-xl md:text-2xl font-serif font-medium">Settings</h1>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <div className="space-y-4 md:space-y-6">
          <div className="bg-card rounded-lg p-4 border">
            <h2 className="text-lg font-medium mb-3 font-serif flex items-center gap-2">
              <span>Preferences</span>
            </h2>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Label htmlFor="theme" className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose your preferred theme
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {getThemeLabel(currentTheme)}
                </span>
                <ThemeToggle variant="settings" />
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-4 border">
            <h2 className="text-lg font-medium mb-3 font-serif">Account</h2>
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Signed in</p>
                  </div>
                </div>
                <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to sync your notes across all devices
                </p>
                <Button onClick={handleSignIn} size="sm" className="w-full">
                  Sign In
                </Button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <h2 className="text-lg font-medium mb-3 font-serif flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-b-0">
                  <AccordionTrigger className="text-sm font-medium text-left py-3 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          <div className="bg-card rounded-lg p-4 border">
            <h2 className="text-lg font-medium mb-3 font-serif">About Noteily</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Noteily - "Write What You Love" is a minimalist notes app focused on creative expression and passionate writing.
              </p>
              <p className="text-xs text-muted-foreground">
                Version 2.0.1
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
