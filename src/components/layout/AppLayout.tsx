import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { NoteProvider } from "@/contexts/NoteContext";
import { AiButtonProvider } from "@/contexts/AiButtonContext";
import { OfflineIndicator } from "@/components/notifications/OfflineIndicator";
import { useIsMobile } from "@/hooks/use-mobile";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <NoteProvider>
      <AiButtonProvider>
        <SidebarProvider>
          <div className="flex min-h-[100dvh] w-full">
            {/* Main content area */}
            <main className={`flex-1 min-w-0 ${isMobile ? 'pb-20' : ''}`}>
              {children}
            </main>

            {/* Show BottomNav on all screens (mobile bottom, desktop left sidebar) */}
            <BottomNav />
          </div>
          <OfflineIndicator />
        </SidebarProvider>
      </AiButtonProvider>
    </NoteProvider>
  );
}
