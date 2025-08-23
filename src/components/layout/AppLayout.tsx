
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NoteProvider } from "@/contexts/NoteContext";
import { OfflineIndicator } from "@/components/notifications/OfflineIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { useState } from "react";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(!user);

  // Show login dialog for unauthenticated users
  if (!user) {
    return (
      <>
        {children}
        <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
      </>
    );
  }

  return (
    <NoteProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full animate-fade-in">
          <AppSidebar />
          <main className="flex-1 md:pl-6 lg:pl-8 xl:pl-10">
            {children}
          </main>
        </div>
        <OfflineIndicator />
      </SidebarProvider>
    </NoteProvider>
  );
}
