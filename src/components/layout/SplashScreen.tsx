import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for fade out animation to complete
      setTimeout(onComplete, 300);
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50 animate-fade-out pointer-events-none">
        <Heart className="h-16 w-16 text-neon-blue animate-gentle-bounce" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 animate-scale-in">
      <Heart className="h-16 w-16 text-neon-blue animate-gentle-bounce" />
    </div>
  );
}