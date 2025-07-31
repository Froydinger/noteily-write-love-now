import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show for a brief moment, then fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Complete after fade animation
      setTimeout(onComplete, 300);
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 bg-background flex items-center justify-center z-50 transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Heart className="h-16 w-16 text-accent" />
    </div>
  );
}