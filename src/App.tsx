
import { useState, useEffect } from "react";
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

import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";

import LanderPage from "./pages/LanderPage";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { NotificationToastListener } from "./components/notifications/NotificationToastListener";
import { useAuth } from "./contexts/AuthContext";
import { LoadingSpinner } from "./components/ui/loading-spinner";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Sonner />
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const AppContent = () => {
  const { user, initializing } = useAuth();

  // Show loading spinner during authentication initialization
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public routes - accessible to everyone */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Protected routes - require authentication */}
        {user ? (
          <>
            <Route
              path="/"
              element={
                <PreferencesProvider>
                  <NotificationToastListener />
                  <AppLayout><Index /></AppLayout>
                </PreferencesProvider>
              }
            />
            <Route
              path="/note/:id"
              element={
                <PreferencesProvider>
                  <AppLayout><NotePage /></AppLayout>
                </PreferencesProvider>
              }
            />
            <Route
              path="/prompts"
              element={
                <PreferencesProvider>
                  <AppLayout><PromptsPage /></AppLayout>
                </PreferencesProvider>
              }
            />
            <Route
              path="/settings"
              element={
                <PreferencesProvider>
                  <AppLayout><SettingsPage /></AppLayout>
                </PreferencesProvider>
              }
            />
            <Route path="*" element={<PreferencesProvider><NotFound /></PreferencesProvider>} />
          </>
        ) : (
          <>
            {/* Unauthenticated users see landing page on root */}
            <Route path="/" element={<LanderPage />} />
            <Route path="*" element={<NotFound />} />
          </>
        )}
      </Routes>
      <PWAInstall />
      <PWAUpdateNotification />
    </>
  );
};

export default App;
