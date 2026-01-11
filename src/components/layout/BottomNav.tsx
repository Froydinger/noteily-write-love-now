import { useLocation, useNavigate } from 'react-router-dom';
import { NotebookTabs, Plus, Lightbulb, Settings, FileText, CheckSquare, Brain } from 'lucide-react';
import { useNotes } from '@/contexts/NoteContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { useAiButton } from '@/contexts/AiButtonContext';
import { cn } from '@/lib/utils';
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
  const { isAiButtonVisible, openAiChat } = useAiButton();

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glass background */}
      <div className="absolute inset-0 glass-nav" />
      
      {/* Safe area spacer for iOS */}
      <div className="relative flex items-end justify-around px-4 h-16 pb-2 pb-safe">
        {/* Left nav item - Home */}
        {leftNavItems.map((item) => (
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

        {/* AI Button - only shown when viewing/editing a note */}
        {isAiButtonVisible && (
          <button
            onClick={openAiChat}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-250",
              "text-accent hover:text-accent"
            )}
          >
            <div className="relative">
              <Brain className="h-6 w-6 transition-transform duration-250" />
              {/* Subtle glow indicator */}
              <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse-soft -z-10 scale-150" />
            </div>
            <span className="text-[10px] font-medium">AI</span>
          </button>
        )}

        {/* Center FAB - Create Note */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-accent text-accent-foreground shadow-glow hover:shadow-glow-lg transition-all duration-250 hover:scale-105 active:scale-95">
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

        {/* Right nav items */}
        {rightNavItems.map((item) => (
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
