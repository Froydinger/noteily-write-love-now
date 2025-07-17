
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
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      question: "Is my data secure?",
      answer: "Yes, your notes are encrypted and securely stored. When signed in, they sync across your devices."
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
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <Label htmlFor="dark-mode" className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Toggle between dark and light theme
                </p>
              </div>
              <ThemeToggle />
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
