
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { PWAInstall } from "./components/pwa/PWAInstall";
import { PWAUpdateNotification } from "./components/pwa/PWAUpdateNotification";
import Index from "./pages/Index";
import NotePage from "./pages/NotePage";
import PromptsPage from "./pages/PromptsPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<AppLayout><Index /></AppLayout>} />
            <Route path="/note/:id" element={<AppLayout><NotePage /></AppLayout>} />
            <Route path="/prompts" element={<AppLayout><PromptsPage /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PWAInstall />
          <PWAUpdateNotification />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
