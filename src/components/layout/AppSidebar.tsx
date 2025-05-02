
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  Plus, 
  Menu, 
  Heart, 
  Settings, 
  Pencil 
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
  SidebarTrigger
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNotes, Note } from "@/contexts/NoteContext";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/theme/ThemeToggle";

export function AppSidebar() {
  const { notes, addNote, setCurrentNote } = useNotes();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const filteredNotes = searchTerm 
    ? notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : notes;

  const handleCreateNote = () => {
    const newNote = addNote();
    setCurrentNote(newNote);
    navigate(`/note/${newNote.id}`);
    
    toast({
      title: "Note created",
      description: "Your new note has been created.",
    });
  };
  
  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    navigate(`/note/${note.id}`);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-neon-blue" />
          <h1 className="text-xl font-serif font-medium">Noteily</h1>
        </div>
        {isMobile && <SidebarTrigger />}
      </SidebarHeader>
      
      <SidebarContent className="pt-0">
        <SidebarGroup>
          <div className="px-4 py-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 bg-secondary dark:border-neon-blue/30 dark:hover:border-neon-blue"
              onClick={handleCreateNote}
            >
              <Plus className="h-4 w-4 dark:text-neon-blue" />
              New Note
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={isActive('/') ? 'sidebar-menu-active' : ''}
                >
                  <a href="/" className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4" />
                    <span>All Notes</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={isActive('/prompts') ? 'sidebar-menu-active' : ''}
                >
                  <a href="/prompts" className="flex items-center gap-3">
                    <Pencil className="h-4 w-4" />
                    <span>Writing Prompts</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-4 py-2">Recent Notes</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="px-2 py-1">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <div 
                      key={note.id}
                      className={`px-2 py-2 rounded-md hover:bg-secondary cursor-pointer transition-colors ${location.pathname === `/note/${note.id}` ? 'bg-accent text-accent-foreground dark:shadow-neon-blue-sm' : ''}`}
                      onClick={() => handleSelectNote(note)}
                    >
                      <h3 className="text-sm font-medium truncate">{note.title || "Untitled Note"}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {note.content ? note.content.substring(0, 60) : "No content"}
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
                        className="mt-2"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 flex flex-col gap-2">
        <ThemeToggle />
        <Button 
          variant="ghost" 
          size="sm"
          className={`w-full justify-start text-muted-foreground ${isActive('/settings') ? 'sidebar-menu-active' : ''}`}
          asChild
        >
          <a href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
