
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NoteProvider } from "@/contexts/NoteContext";
import { OfflineIndicator } from "@/components/notifications/OfflineIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <NoteProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full apple-pwa-content">
          <AppSidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
        <OfflineIndicator />
      </SidebarProvider>
    </NoteProvider>
  );
}
