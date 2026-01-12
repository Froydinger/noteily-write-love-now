import { useLocation, useNavigate } from 'react-router-dom';
import { NotebookTabs, Plus, Lightbulb, Settings, FileText, CheckSquare } from 'lucide-react';
import { useNotes } from '@/contexts/NoteContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteType } from "@/types/sharing";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addNote, setCurrentNote } = useNotes();
  const isMobile = useIsMobile();
  const { state, toggleSidebar } = useSidebar();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect keyboard open/close on mobile
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      // When keyboard opens, visual viewport height is smaller than window height
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;

      // If viewport is significantly smaller (more than 150px), keyboard is likely open
      setIsKeyboardOpen(windowHeight - viewportHeight > 150);
    };

    window.visualViewport.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/note/');
    }
    return location.pathname === path;
  };

  const handleCreateNote = async (noteType: NoteType = 'note') => {
    try {
      const newNote = await addNote(noteType);
      setCurrentNote(newNote);
      if (isMobile && state === "expanded") {
        toggleSidebar();
        await new Promise(resolve => setTimeout(resolve, 350));
      }
      navigate(`/note/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // Dynamic nav items based on AI button visibility
  const leftNavItems = [
    { path: '/', icon: NotebookTabs, label: 'Notes' },
  ];

  const rightNavItems = [
    { path: '/prompts', icon: Lightbulb, label: 'Ideas' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300",
      isKeyboardOpen && "translate-y-full"
    )}>
      {/* Glass background */}
      <div className="absolute inset-0 glass-nav" />

      {/* FAB - Create Note (Bottom Left) */}
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute left-[26px] bottom-5 flex items-center justify-center w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-glow hover:shadow-glow-lg transition-all duration-250 hover:scale-105 active:scale-95 z-10">
              <Plus className="h-7 w-7" />
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse-soft -z-10 scale-125" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            side="top"
            sideOffset={12}
            className="w-[200px] glass-card border-border/30 rounded-2xl shadow-elevated-lg"
          >
            <DropdownMenuItem 
              onClick={() => handleCreateNote('note')} 
              className="flex items-center gap-3 py-3 px-4 cursor-pointer rounded-xl hover:bg-accent/20 hover:text-foreground focus:bg-accent/20 focus:text-foreground"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Note</span>
                <span className="text-xs text-muted-foreground">Free-form writing</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleCreateNote('checklist')} 
              className="flex items-center gap-3 py-3 px-4 cursor-pointer rounded-xl hover:bg-accent/20 hover:text-foreground focus:bg-accent/20 focus:text-foreground"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
                <CheckSquare className="h-4 w-4 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Checklist</span>
                <span className="text-xs text-muted-foreground">Task list with checkboxes</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      {/* Safe area spacer for iOS */}
      <div className="relative flex items-end justify-around px-4 pl-24 h-20 pb-2 pb-safe">
        {/* Nav items - Notes, Ideas, Settings */}
        {[...leftNavItems, ...rightNavItems].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-250",
              isActive(item.path)
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "h-6 w-6 transition-transform duration-250",
              isActive(item.path) && "scale-110"
            )} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
