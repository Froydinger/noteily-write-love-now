import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to complete and ensure user is loaded
    if (!authLoading && user) {
      // Add a small delay to ensure everything is ready
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for fade out animation to complete
        setTimeout(onComplete, 300);
      }, 800);

      return () => clearTimeout(timer);
    } else if (!authLoading && !user) {
      // If no user, proceed immediately 
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [authLoading, user, onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50 animate-fade-out pointer-events-none">
        <Heart className="h-16 w-16 text-neon-blue animate-pulse" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 animate-scale-in">
      <Heart className="h-16 w-16 text-neon-blue animate-heartbeat" />
    </div>
  );
}