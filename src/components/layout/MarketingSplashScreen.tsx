import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, PenTool, Shield, Users, Smartphone, Cloud, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MarketingSplashScreenProps {
  onClose: () => void;
}

export function MarketingSplashScreen({ onClose }: MarketingSplashScreenProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: <PenTool className="h-8 w-8" />,
      title: "Beautiful Writing Experience",
      description: "Distraction-free editor with rich formatting and beautiful themes"
    },
    {
      icon: <Cloud className="h-8 w-8" />,
      title: "Sync Across Devices",
      description: "Your notes are always up-to-date on all your devices"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Private & Secure",
      description: "End-to-end encryption keeps your thoughts private"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Share & Collaborate",
      description: "Share notes with friends and collaborate in real-time"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Works Everywhere",
      description: "Progressive Web App that works on any device, online or offline"
    }
  ];

  if (showFeatures) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <Card className="border-2 border-accent/20 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-serif mb-2">Why Choose Noteily?</h2>
                  <p className="text-muted-foreground">The note-taking app designed for passionate writers</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowFeatures(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="text-center p-4 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                    <div className="flex justify-center mb-4 text-accent">
                      {feature.icon}
                    </div>
                    <h3 className="font-serif text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Ready to start writing what you love?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/auth')} 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Get Started Free
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Continue as Guest
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Heart className="h-20 w-20 text-accent animate-heartbeat" />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif text-foreground">
            Noteily
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            Write What You Love
          </p>
        </div>

        <div className="space-y-6">
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            A minimalist notes app focused on creative expression and passionate writing. 
            Beautiful, secure, and designed for writers who love their craft.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Start Writing Today
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowFeatures(true)}
            >
              Learn More
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>✨ Free to start • 🔒 Private & secure • 📱 Works everywhere</p>
            <p>
              Questions? Contact us at{' '}
              <a href="mailto:help@noteily.app" className="text-accent hover:underline">
                help@noteily.app
              </a>
            </p>
          </div>
        </div>

        <div className="pt-8">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Continue without account
          </Button>
        </div>
      </div>
    </div>
  );
}