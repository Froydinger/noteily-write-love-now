
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NoteProvider } from "@/contexts/NoteContext";
import { OfflineIndicator } from "@/components/notifications/OfflineIndicator";
import { useAuth } from "@/contexts/AuthContext";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();

  // For unauthenticated users, just show the children (Index will handle the marketing page)
  if (!user) {
    return <>{children}</>;
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
