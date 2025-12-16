
import { useState } from "react";
import { useTitleFont } from '@/hooks/useTitleFont';
import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Heart,
  Settings,
  Pencil,
  RefreshCw,
  Trash2,
  Bell,
  PanelLeftClose,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  useSidebar
} from "@/components/ui/sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { Button } from "@/components/ui/button";
import { useNotes, Note } from "@/contexts/NoteContext";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const titleFont = useTitleFont();
  const { notes, addNote, setCurrentNote, syncNotes } = useNotes();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { state, toggleSidebar } = useSidebar();

  // Get initial accordion state from localStorage, default to closed
  const [recentNotesOpen, setRecentNotesOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-recent-notes-open');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Save accordion state to localStorage
  const handleRecentNotesToggle = (isOpen: boolean) => {
    setRecentNotesOpen(isOpen);
    localStorage.setItem('sidebar-recent-notes-open', JSON.stringify(isOpen));
  };

  const filteredNotes = searchTerm
    ? notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : notes;

  const handleCreateNote = async () => {
    try {
      const newNote = await addNote();
      setCurrentNote(newNote);
      navigate(`/note/${newNote.id}`);

      toast({
        title: "Note created",
        description: "Your new note has been created.",
      });
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleSync = async () => {
    // Hide sidebar first
    if (isMobile && state === "expanded") {
      toggleSidebar();
    }

    // Then sync notes
    await syncNotes();
  };

  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    navigate(`/note/${note.id}`);

    // Auto-hide sidebar on mobile after selecting a note
    if (isMobile && state === "expanded") {
      toggleSidebar();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Sidebar
      className="transition-all duration-350 ease-bounce-out bg-sidebar/70 backdrop-blur-2xl border-r border-border/30"
      collapsible="offcanvas"
    >
      <SidebarHeader className="flex flex-row items-center justify-between px-5 py-5 gap-0 apple-pwa-sidebar-header">
        <div className={`flex items-center space-x-3 flex-1 ${state === "collapsed" ? "justify-center" : ""}`}>
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
            <Heart className="h-5 w-5 text-accent" fill="currentColor" />
          </div>
          {state !== "collapsed" && (
            <div className="flex items-center">
              <h1 className="text-xl font-display font-medium tracking-tight dynamic-title-font">Noteily</h1>
              <span className="text-[10px] text-muted-foreground ml-0.5 -mt-2 font-medium">TM</span>
            </div>
          )}
        </div>
        {state !== "collapsed" && (
          <div className="flex items-center gap-1">
            {user && (
              <NotificationsPanel>
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-accessible h-9 w-9 rounded-full flex-shrink-0 relative hover:bg-accent/10"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </NotificationsPanel>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="btn-accessible h-9 w-9 rounded-full flex-shrink-0 hover:bg-accent/10 hidden md:flex"
              title="Hide sidebar"
              onClick={toggleSidebar}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarHeader>

      {state !== "collapsed" && (
        <SidebarContent className="pt-2 px-3">
          <div className="mb-5">
            <Button
              variant="default"
              className="w-full justify-center gap-2.5 h-11 group
                bg-gradient-to-r from-accent to-accent/90
                hover:from-accent/90 hover:to-accent
                text-accent-foreground font-medium
                rounded-full shadow-glow-sm hover:shadow-glow
                transition-all duration-250 ease-bounce-out
                hover:scale-[1.02] active:scale-[0.98]
                apple-pwa-button-spacing"
              onClick={handleCreateNote}
            >
              <Plus className="h-4 w-4 transition-transform duration-250 group-hover:rotate-90" />
              <span>New Note</span>
            </Button>
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              {/* Horizontal navigation buttons */}
              <div className="flex justify-center mb-5">
                <div className="flex gap-2 w-full p-1 bg-secondary/50 rounded-xl">
                  <Button
                    variant={isActive('/') ? 'default' : 'ghost'}
                    size="sm"
                    asChild
                    className={`flex-1 h-9 rounded-lg font-medium text-sm transition-all duration-250 text-foreground
                      ${isActive('/') ? 'bg-card shadow-sm text-foreground' : 'hover:bg-card/50'}
                    `}
                  >
                    <a href="/" className="flex items-center justify-center gap-2 text-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>All</span>
                    </a>
                  </Button>
                  <Button
                    variant={isActive('/prompts') ? 'default' : 'ghost'}
                    size="sm"
                    asChild
                    className={`flex-1 h-9 rounded-lg font-medium text-sm transition-all duration-250 text-foreground
                      ${isActive('/prompts') ? 'bg-card shadow-sm text-foreground' : 'hover:bg-card/50'}
                    `}
                  >
                    <a href="/prompts" className="flex items-center justify-center gap-2 text-foreground">
                      <Pencil className="h-4 w-4" />
                      <span>Ideas</span>
                    </a>
                  </Button>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="py-2">
            <Accordion
              type="single"
              collapsible
              value={recentNotesOpen ? "recent-notes" : undefined}
              onValueChange={(value) => handleRecentNotesToggle(value === "recent-notes")}
            >
              <AccordionItem value="recent-notes" className="border-none">
                <AccordionTrigger className="w-full px-4 py-2.5 rounded-xl hover:no-underline hover:bg-secondary/50 transition-all duration-250 font-medium text-foreground data-[state=closed]:mb-0 h-10">
                  <div className="flex items-center justify-center gap-2.5 w-full">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Recent Notes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pt-2">
                  <SidebarGroupContent>
                    <div className="h-[calc(100vh-380px)] overflow-y-auto scrollbar-hide pr-1"
                         style={{
                           scrollbarWidth: 'none',
                           msOverflowStyle: 'none'
                         }}>
                      <style>{`
                        .scrollbar-hide::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      <div className="space-y-1">
                        {filteredNotes.length > 0 ? (
                          filteredNotes.map((note, index) => (
                            <div
                              key={note.id}
                              className={`
                                px-3 py-2.5 rounded-lg cursor-pointer
                                transition-all duration-250 ease-bounce-out
                                hover:bg-secondary/60
                                ${location.pathname === `/note/${note.id}` ? 'sidebar-menu-active' : ''}
                              `}
                              onClick={() => handleSelectNote(note)}
                              style={{
                                animationDelay: `${index * 0.03}s`,
                                animationFillMode: 'both'
                              }}
                            >
                              <h3 className="text-sm font-medium truncate dynamic-title-font text-foreground/90">
                                {note.title || "Untitled Note"}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
                                {note.content ?
                                  note.content
                                    .replace(/<[^>]*>?/gm, '')
                                    .replace(/&nbsp;/g, ' ')
                                    .replace(/&[a-z]+;/gi, ' ')
                                    .trim()
                                    .substring(0, 50)
                                  : "No content"
                                }
                              </p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-6 text-center text-muted-foreground">
                            <p className="text-sm">No notes found</p>
                            {searchTerm && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-3 btn-accessible rounded-full text-xs"
                                onClick={() => setSearchTerm("")}
                              >
                                Clear search
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </SidebarGroupContent>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroup>

        </SidebarContent>
      )}


      <SidebarFooter className="px-4 py-4 border-t border-border/20 apple-pwa-bottom-safe">
        <div className="flex justify-between items-center w-full gap-1 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            className="btn-accessible h-9 w-9 rounded-full hover:bg-accent/10"
            title="Sync notes"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <ThemeToggle variant="settings" />

          <Button
            variant="ghost"
            size="sm"
            className={`btn-accessible h-9 w-9 rounded-full hover:bg-accent/10 ${isActive('/recently-deleted') ? 'bg-accent/10 text-accent' : ''}`}
            asChild
            title="Recently Deleted"
          >
            <a href="/recently-deleted">
              <Trash2 className="h-4 w-4" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`btn-accessible h-9 w-9 rounded-full hover:bg-accent/10 ${isActive('/settings') ? 'bg-accent/10 text-accent' : ''}`}
            asChild
            title="Settings"
          >
            <a href="/settings">
              <Settings className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
