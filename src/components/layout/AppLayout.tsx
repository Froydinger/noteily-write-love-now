
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NoteProvider } from "@/contexts/NoteContext";
import { OfflineIndicator } from "@/components/notifications/OfflineIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2, Heart } from "lucide-react";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Show auth prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-navy-900 via-navy-950 to-background">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-medium mb-4 text-foreground">
            Welcome to Noteily
          </h1>
          <p className="mb-6 text-muted-foreground">
            Sign in to access your notes and sync them across all your devices.
          </p>
          <Button 
            onClick={() => navigate('/')} 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <NoteProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full apple-pwa-content">
          <AppSidebar />
          <main className="flex-1 min-w-0 transition-all duration-300">
            {children}
          </main>
        </div>
        <OfflineIndicator />
      </SidebarProvider>
    </NoteProvider>
  );
}
