import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PWAUpdateNotification = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });

      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          setUpdateAvailable(true);
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  const handleUpdateClick = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          registration.waiting.addEventListener('statechange', () => {
            if (registration.waiting && registration.waiting.state === 'activated') {
              window.location.reload();
            }
          });
        }
      });
    }
    
    toast({
      title: "Updating...",
      description: (
        <div className="space-y-2">
          <p>Close and reopen the web app or refresh your browser to finish the update.</p>
          <p className="text-xs text-muted-foreground">iOS users may need to tap the refresh button twice</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTimeout(() => {
                window.location.reload();
              }, 0);
            }}
            className="w-full mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      ),
      duration: Infinity, // Never expire
    });
    
    setShowUpdatePrompt(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt || !updateAvailable) return null;

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80 animate-slide-up shadow-lg border-neon-blue/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif">Update Available</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          A new version of Noteily is available. Click update, then close and reopen the app or refresh your browser to finish.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={handleUpdateClick}
          className="w-full"
          size="sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Update Now
        </Button>
      </CardContent>
    </Card>
  );
};