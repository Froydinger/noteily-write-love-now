
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { SplashScreen } from "./components/layout/SplashScreen";
import { MarketingSplashScreen } from "./components/layout/MarketingSplashScreen";
import { PWAInstall } from "./components/pwa/PWAInstall";
import { PWAUpdateNotification } from "./components/pwa/PWAUpdateNotification";
import Index from "./pages/Index";
import NotePage from "./pages/NotePage";
import PromptsPage from "./pages/PromptsPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";
import RecentlyDeletedPage from "./pages/RecentlyDeletedPage";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { NotificationToastListener } from "./components/notifications/NotificationToastListener";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showMarketingSplash, setShowMarketingSplash] = useState(false);
  const { user } = useAuth();

  // Show regular splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => {
      setShowSplash(false);
      // Show marketing splash for non-authenticated users
      if (!user) {
        setShowMarketingSplash(true);
      }
    }} />;
  }

  // Show marketing splash for unregistered users
  if (showMarketingSplash && !user) {
    return <MarketingSplashScreen />;
  }

  return (
    <>
      <Toaster />
      <Sonner position="top-right" duration={3000} />
      <NotificationToastListener />
      <PreferencesProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/" element={<AppLayout><Index /></AppLayout>} />
          <Route path="/note/:id" element={<AppLayout><NotePage /></AppLayout>} />
          <Route path="/prompts" element={<AppLayout><PromptsPage /></AppLayout>} />
          <Route path="/recently-deleted" element={<AppLayout><RecentlyDeletedPage /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <PWAInstall />
        <PWAUpdateNotification />
      </PreferencesProvider>
    </>
  );
};

export default App;
