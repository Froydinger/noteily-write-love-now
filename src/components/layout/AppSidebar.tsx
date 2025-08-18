
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  Plus, 
  Heart, 
  Settings, 
  Pencil,
  PanelLeftClose,
  PanelLeft,
  RefreshCw,
  Trash2,
  Bell
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
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
    <Sidebar className="w-64 md:w-72 transition-all duration-300 ease-in-out bg-background/80 backdrop-blur-md border-r border-border/50" collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between px-4 py-4 gap-0">
        <div className={`flex items-center space-x-3 flex-1 ${state === "collapsed" ? "justify-center" : ""}`}>
          <Heart className="h-5 w-5 text-neon-blue" />
          {state !== "collapsed" && <h1 className="text-xl font-serif font-medium">Noteily</h1>}
        </div>
        {state !== "collapsed" && (
          <div className="flex items-center gap-2">
            {user && (
              <NotificationsPanel>
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-accessible h-8 w-8 rounded-full flex-shrink-0 relative"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </NotificationsPanel>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="sidebar-toggle h-8 w-8 p-0 rounded-full"
                title={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
              >
                {state === "expanded" ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
              </Button>
            )}
            {isMobile && <SidebarTrigger />}
          </div>
        )}
        {state === "collapsed" && isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="sidebar-toggle h-8 w-8 p-0 rounded-full"
            title="Expand sidebar"
          >
            <PanelLeft size={16} />
          </Button>
        )}
      </SidebarHeader>
      
      {state !== "collapsed" && (
        <SidebarContent className="pt-2">
          <div className="px-4 mb-4">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-10 btn-accessible group hover:scale-[1.02] transition-all duration-200 hover:shadow-md rounded-full bg-gradient-to-r from-accent/5 to-accent/10 hover:from-accent/10 hover:to-accent/20 border-accent/20 hover:border-accent/40"
              onClick={handleCreateNote}
            >
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90" />
              <span className="font-medium">New Note</span>
            </Button>
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              {/* Horizontal navigation buttons */}
              <div className="flex gap-2 px-4 mb-4">
                <Button
                  variant={isActive('/') ? 'default' : 'outline'}
                  size="sm"
                  asChild
                  className="flex-1 h-9 rounded-full font-medium"
                >
                  <a href="/" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">My Notes</span>
                  </a>
                </Button>
                <Button
                  variant={isActive('/prompts') ? 'default' : 'outline'}
                  size="sm"
                  asChild
                  className="flex-1 h-9 rounded-full font-medium"
                >
                  <a href="/prompts" className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Prompts</span>
                  </a>
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="py-2">
            <div className="px-4">
              <Accordion 
                type="single" 
                collapsible 
                value={recentNotesOpen ? "recent-notes" : undefined}
                onValueChange={(value) => handleRecentNotesToggle(value === "recent-notes")}
              >
                <AccordionItem value="recent-notes" className="border-none">
                  <AccordionTrigger className="w-full px-4 py-2.5 rounded-full hover:no-underline hover:bg-accent/50 transition-colors duration-200 font-medium text-foreground data-[state=closed]:mb-0 h-9">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">Recent Notes</span>
                    </div>
                  </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <SidebarGroupContent>
                    <div className="h-[calc(100vh-320px)] overflow-y-auto scrollbar-hide"
                         style={{
                           scrollbarWidth: 'none', /* Firefox */
                           msOverflowStyle: 'none' /* IE and Edge */
                         }}>
                      <style>{`
                        .scrollbar-hide::-webkit-scrollbar {
                          display: none; /* Safari and Chrome */
                        }
                      `}</style>
                      <div className="px-3 py-1">
                        {filteredNotes.length > 0 ? (
                          filteredNotes.map((note) => (
                            <div 
                              key={note.id}
                              className={`px-3 py-2.5 my-1 rounded-md btn-accessible cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm animate-slide-up-smooth ${location.pathname === `/note/${note.id}` ? 'sidebar-menu-active' : ''}`}
                              onClick={() => handleSelectNote(note)}
                              style={{ 
                                animationDelay: `${notes.indexOf(note) * 0.05}s`,
                                animationFillMode: 'both'
                              }}
                            >
                              <h3 className="text-sm font-medium truncate">{note.title || "Untitled Note"}</h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {note.content ? 
                                  note.content
                                    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
                                    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
                                    .replace(/&[a-z]+;/gi, ' ') // Replace other HTML entities with spaces
                                    .trim()
                                    .substring(0, 60) 
                                  : "No content"
                                }
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="px-2 py-4 text-center text-muted-foreground">
                            <p>No notes found</p>
                            {searchTerm && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 btn-accessible rounded-full"
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
            </div>
          </SidebarGroup>

        </SidebarContent>
      )}

      {state === "collapsed" && (
        <SidebarContent className="pt-2">
          <div className="px-2 mb-4 flex flex-col gap-2 items-center">
            <Button 
              variant="outline" 
              size="sm"
              className="h-10 w-10 p-0 rounded-full"
              onClick={handleCreateNote}
              title="New Note"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            {user && (
              <NotificationsPanel>
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-accessible h-10 w-10 rounded-full relative"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </NotificationsPanel>
            )}
          </div>
        </SidebarContent>
      )}

      <SidebarFooter className="px-4 py-4 border-t border-border/40">
        {state !== "collapsed" ? (
          <div className="flex justify-between w-full px-4 md:px-6">
            <div className="h-8 w-8 flex items-center justify-center flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                className="btn-accessible h-8 w-8 rounded-full flex-shrink-0"
                title="Sync notes"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-8 w-8 flex items-center justify-center flex-shrink-0">
              <ThemeToggle variant="settings" />
            </div>
            
            <div className="h-8 w-8 flex items-center justify-center flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm"
                className={`btn-accessible h-8 w-8 rounded-full flex-shrink-0 ${isActive('/recently-deleted') ? 'sidebar-menu-active' : ''}`}
                asChild
                title="Recently Deleted"
              >
                <a href="/recently-deleted">
                  <Trash2 className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="h-8 w-8 flex items-center justify-center flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm"
                className={`btn-accessible h-8 w-8 rounded-full flex-shrink-0 ${isActive('/settings') ? 'sidebar-menu-active' : ''}`}
                asChild
                title="Settings"
              >
                <a href="/settings">
                  <Settings className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center">
            <div className="h-8 w-8 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                className="btn-accessible h-8 w-8 rounded-full"
                title="Sync notes"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-8 w-8 flex items-center justify-center">
              <ThemeToggle variant="settings" />
            </div>
            
            <div className="h-8 w-8 flex items-center justify-center">
              <Button 
                variant="ghost" 
                size="sm"
                className={`btn-accessible h-8 w-8 rounded-full ${isActive('/recently-deleted') ? 'sidebar-menu-active' : ''}`}
                asChild
                title="Recently Deleted"
              >
                <a href="/recently-deleted">
                  <Trash2 className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="h-8 w-8 flex items-center justify-center">
              <Button 
                variant="ghost" 
                size="sm"
                className={`btn-accessible h-8 w-8 rounded-full ${isActive('/settings') ? 'sidebar-menu-active' : ''}`}
                asChild
                title="Settings"
              >
                <a href="/settings">
                  <Settings className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
