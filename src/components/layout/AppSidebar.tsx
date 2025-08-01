
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
  Trash2
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

import { Button } from "@/components/ui/button";
import { useNotes, Note } from "@/contexts/NoteContext";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/theme/ThemeToggle";

export function AppSidebar() {
  const { notes, addNote, setCurrentNote, syncNotes } = useNotes();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { state, toggleSidebar } = useSidebar();

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
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between px-4 py-4 md:pt-6 gap-0">
        <div className="flex items-center space-x-3 flex-1">
          <Heart className="h-5 w-5 text-neon-blue" />
          <h1 className="text-xl font-serif font-medium">Noteily</h1>
        </div>
        <div className="flex items-center">
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
      </SidebarHeader>
      
      <SidebarContent className="pt-2">
        <div className="px-4 py-2 mb-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 py-5 btn-accessible group hover:scale-[1.02] transition-all duration-200 hover:shadow-md rounded-full"
            onClick={handleCreateNote}
          >
            <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="font-medium">New Note</span>
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={`px-4 py-2 rounded-full ${isActive('/') ? 'sidebar-nav-active' : ''}`}
                >
                  <a href="/" className="flex items-center gap-3 rounded-full">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">All Notes</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={`px-4 py-2 rounded-full ${isActive('/prompts') ? 'sidebar-nav-active' : ''}`}
                >
                  <a href="/prompts" className="flex items-center gap-3 rounded-full">
                    <Pencil className="h-4 w-4" />
                    <span className="font-medium">Writing Prompts</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-4">
          <SidebarGroupLabel className="px-4 text-sm uppercase tracking-wider font-medium text-muted-foreground mb-1">Recent Notes</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="h-[calc(100vh-280px)] overflow-y-auto">
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
                        {note.content ? note.content.replace(/<[^>]*>?/gm, '').substring(0, 60) : "No content"}
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
        </SidebarGroup>

        {/* Recently Deleted Section */}
        <div className="px-4 pb-2">
          <SidebarMenuButton 
            asChild
            className={`w-full px-4 py-2 rounded-full ${isActive('/recently-deleted') ? 'sidebar-nav-active' : ''}`}
          >
            <a href="/recently-deleted" className="flex items-center gap-3 rounded-full">
              <Trash2 className="h-4 w-4" />
              <span className="font-medium">Recently Deleted</span>
            </a>
          </SidebarMenuButton>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40">
        <div className="flex items-center justify-center gap-1">
          <ThemeToggle variant="settings" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            className="btn-accessible h-8 w-8 p-0 rounded-full"
            title="Sync notes"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className={`btn-accessible h-8 w-8 p-0 rounded-full ${isActive('/settings') ? 'sidebar-menu-active' : ''}`}
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
