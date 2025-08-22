
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
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'linear-gradient(180deg, hsl(215, 55%, 18%) 0%, hsl(218, 50%, 14%) 30%, hsl(220, 55%, 10%) 70%, hsl(222, 60%, 7%) 100%) !important',
          backgroundAttachment: 'fixed',
          backgroundColor: 'hsl(215, 45%, 12%) !important'
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Heart className="h-12 w-12" style={{ color: '#1EAEDB' }} />
          </div>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontFamily: 'Playfair Display, serif', 
            fontWeight: '500', 
            marginBottom: '1rem',
            color: 'hsl(210, 40%, 95%) !important' 
          }}>
            Welcome to Noteily
          </h1>
          <p style={{ 
            marginBottom: '1.5rem',
            color: 'hsl(210, 20%, 70%) !important' 
          }}>
            Sign in to access your notes and sync them across all your devices.
          </p>
          <Button 
            onClick={() => navigate('/')} 
            size="lg"
            className="hover:bg-[#0FA0CE] focus:bg-[#0FA0CE] active:bg-[#0FA0CE]"
            style={{
              backgroundColor: '#1EAEDB !important',
              color: '#ffffff !important',
              borderColor: '#1EAEDB !important',
              border: '1px solid #1EAEDB !important',
              fontWeight: '600 !important'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0FA0CE !important';
              e.currentTarget.style.color = '#ffffff !important';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1EAEDB !important';
              e.currentTarget.style.color = '#ffffff !important';
            }}
          >
            <LogIn className="mr-2 h-4 w-4" style={{ color: '#ffffff !important' }} />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <NoteProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto md:pl-6 lg:pl-8 xl:pl-10">
            {children}
          </main>
        </div>
        <OfflineIndicator />
      </SidebarProvider>
    </NoteProvider>
  );
}
