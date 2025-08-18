
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes } from '@/contexts/NoteContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, User, HelpCircle, Download, Trash2, Key, Heart, AtSign, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { Input } from '@/components/ui/input';
import { useUsername } from '@/hooks/useUsername';

const SettingsPage = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { notes } = useNotes();
  const { preferences } = usePreferences();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { username, loading: usernameLoading, setUsername, removeUsername } = useUsername();

  // Check if we should show username section expanded
  const shouldShowUsernameSection = searchParams.get('section') === 'username';


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
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      // Force navigation to ensure user sees they're logged out
      navigate('/');
    } catch (error) {
      console.error('Settings page sign out error:', error);
      // Even if signOut fails, navigate to home
      navigate('/');
    }
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
      answer: "Select text to see your device's formatting options like bold, italic, and more. Most devices support native text formatting when you select text."
    },
    {
      question: "Is my data secure and private?",
      answer: "Yes, your notes are encrypted with your unique key and stored securely. Only you can access your notes - we cannot read them, and neither can anyone else. When signed in, your encrypted notes sync across your devices."
    }
  ];

  const handleExportNotes = () => {
    if (!notes.length) {
      toast({
        title: "No notes to export",
        description: "You don't have any notes to export yet.",
        variant: "destructive",
      });
      return;
    }

    // Create a formatted text content with all notes
    const exportContent = notes.map(note => {
      const createdDate = new Date(note.createdAt).toLocaleDateString();
      const updatedDate = new Date(note.updatedAt).toLocaleDateString();
      
      return `
=====================================
Title: ${note.title}
Created: ${createdDate}
Updated: ${updatedDate}
=====================================

${note.content}

`;
    }).join('\n');

    // Create blob and download
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noteily-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Notes exported",
      description: `Successfully exported ${notes.length} notes to a text file.`,
    });
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Password required",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setNewPassword('');
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error changing password",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isGoogleUser = () => {
    return user?.app_metadata?.providers?.includes('google') || 
           user?.identities?.some(identity => identity.provider === 'google');
  };

  const hasPassword = () => {
    // Check if user has a password set (users who signed up with Google initially don't have a password)
    return user?.app_metadata?.provider !== 'google' || newPassword.trim().length >= 6;
  };

  const handleDisconnectGoogle = async () => {
    if (!user || !isGoogleUser()) return;

    // Require password to be set first
    if (newPassword.trim().length < 6) {
      toast({
        title: "Password required",
        description: "Please set a password before disconnecting Google. This ensures you can still access your account.",
        variant: "destructive",
      });
      return;
    }

    setIsDisconnectingGoogle(true);

    try {
      // First set password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (passwordError) {
        throw passwordError;
      }
      
      setNewPassword('');

      toast({
        title: "Password set successfully",
        description: "Your password has been set. You can now sign in with email/password. To fully disconnect Google, please contact support.",
      });
    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        title: "Error setting password",
        description: error.message || "Failed to set password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnectingGoogle(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      // First delete user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id);

      if (preferencesError) {
        console.warn('Error deleting user preferences:', preferencesError);
      }

      // Then delete all user's notes
      const { error: notesError } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', user.id);

      if (notesError) {
        throw notesError;
      }

      // Sign out the user which will clear their session
      await signOut();

      // Clear local storage
      localStorage.clear();
      
      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      
      // Navigate to auth page
      navigate('/auth');
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error deleting account",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUsernameSubmit = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username.",
        variant: "destructive",
      });
      return;
    }

    const success = await setUsername(newUsername.trim());
    if (success) {
      setNewUsername('');
      setIsEditingUsername(false);
    }
  };

  const handleUsernameRemove = async () => {
    const success = await removeUsername();
    if (success) {
      setIsEditingUsername(false);
    }
  };

  const startEditingUsername = () => {
    setNewUsername(username || '');
    setIsEditingUsername(true);
  };

  const cancelEditingUsername = () => {
    setNewUsername('');
    setIsEditingUsername(false);
  };

  return (
    <div className="h-full">
      <div className="p-3 md:p-6 pb-32 animate-fade-in min-h-screen">
        {/* Mobile layout: Settings text on far right */}
        <div className="md:hidden mb-6">
          {/* Top row: Menu button left, title far right */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {(isMobile || state === "collapsed") && (
                <div className="relative">
                  <SidebarTrigger />
                  {user && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
              )}
            </div>
            <h1 className="text-xl font-serif font-medium">Settings</h1>
          </div>
        </div>

        {/* Desktop layout: Menu button left, title far right */}
        <div className="hidden md:flex items-center justify-between mb-6">
          {/* Left side: Menu button */}
          <div className="flex items-center gap-4 px-2 py-2">
            {(isMobile || state === "collapsed") && (
              <div className="relative">
                <SidebarTrigger />
                {user && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-medium">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side: Title */}
          <h1 className="text-2xl font-serif font-medium">Settings</h1>
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
                  {getThemeLabel(preferences.theme)}
                </span>
                <ThemeToggle variant="settings" />
              </div>
            </div>
          </div>
          
          
          <div className="bg-card rounded-lg p-4 border">
            <h2 className="text-lg font-medium mb-3 font-serif">Account</h2>
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Signed in</p>
                  </div>
                </div>

                {/* Username section */}
                <div className="space-y-3 border-t pt-3">
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Username for Easy Sharing</Label>
                  </div>
                  
                  {!isEditingUsername ? (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        {username ? (
                          <div>
                            <p className="text-sm font-medium">@{username}</p>
                            <p className="text-xs text-muted-foreground">
                              Others can share notes with @{username}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-muted-foreground">No username set</p>
                            <p className="text-xs text-muted-foreground">
                              Set a username for easy sharing
                            </p>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={startEditingUsername}
                        disabled={usernameLoading}
                      >
                        {username ? 'Change' : 'Set Username'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">@</span>
                          <Input
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="username"
                            className="pl-8"
                            disabled={usernameLoading}
                            onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                          />
                        </div>
                        <Button 
                          size="sm" 
                          onClick={handleUsernameSubmit}
                          disabled={usernameLoading || !newUsername.trim()}
                        >
                          {usernameLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={cancelEditingUsername}
                          disabled={usernameLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {username && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleUsernameRemove}
                          disabled={usernameLoading}
                          className="text-destructive hover:text-destructive w-full"
                        >
                          Remove Username
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        3-20 characters, lowercase letters, numbers, and underscores only
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="new-password" className="text-sm font-medium">Change Password</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleChangePassword} 
                      size="sm" 
                      disabled={isChangingPassword || !newPassword.trim()}
                    >
                      {isChangingPassword ? "Updating..." : "Update"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>
                
                {isGoogleUser() && (
                  <div className="space-y-3 border-t pt-3">
                    <div className="text-sm">
                      <p className="font-medium text-muted-foreground mb-1">Google Account Connected</p>
                      <p className="text-xs text-muted-foreground">
                        Set a password to enable email/password login as backup
                      </p>
                    </div>
                    <Button 
                      onClick={handleDisconnectGoogle} 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      disabled={isDisconnectingGoogle || newPassword.trim().length < 6}
                    >
                      {isDisconnectingGoogle ? "Setting Password..." : "Set Password for Account Security"}
                    </Button>
                  </div>
                )}
                
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
                Version 2.0.5
              </p>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-4 border">
            <h2 className="text-lg font-medium mb-3 font-serif flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" fill="#e91e63" />
              Support Noteily
            </h2>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enjoying Noteily? Consider supporting development to help keep the app running and add new features.
              </p>
              <a 
                href="https://buymeacoffee.com/froydinger" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm btn-accessible py-2 px-3 rounded-md border border-border hover:bg-accent transition-colors"
              >
                <Heart className="h-4 w-4 text-pink-500" fill="#e91e63" />
                <span>Buy me a coffee</span>
              </a>
            </div>
          </div>

          {user && (
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-lg font-medium mb-3 font-serif">Data Management</h2>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleExportNotes} 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Notes
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? "Deleting..." : "Delete Account"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove all your notes from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Export Notes:</strong> Download all your notes as a single text file.</p>
                  <p><strong>Delete Account:</strong> Permanently remove your account and all associated data.</p>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
