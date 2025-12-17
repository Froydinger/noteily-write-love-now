import { useState } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/auth/LoginDialog';

export default function LanderPage() {
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card/30 overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/50 border-b border-border/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10">
              <Heart className="h-6 w-6 text-accent animate-heartbeat" fill="currentColor" />
            </div>
            <span className="text-lg font-display font-semibold tracking-tight">Noteily</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLoginDialog(true)}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => setShowLoginDialog(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32 max-w-6xl mx-auto">
        <div className="relative text-center space-y-8 animate-fade-in">
          {/* Logo with animation */}
          <div className="flex justify-center">
            <div
              className="p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 backdrop-blur-xl border border-accent/20"
              style={{
                animation: 'float 3s ease-in-out infinite',
                transform: `translateY(${Math.sin(scrollY * 0.01) * 5}px)`
              }}
            >
              <Heart className="h-20 w-20 text-accent animate-heartbeat" fill="currentColor" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight">
              Write What You{' '}
              <span className="bg-gradient-to-r from-accent via-accent to-purple-400 bg-clip-text text-transparent">
                Love
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-foreground/70 font-light max-w-2xl mx-auto">
              The note-taking app designed for passionate writers. Beautiful, fast, and built for your creative flow.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => setShowLoginDialog(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground group"
            >
              Start Writing
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowLoginDialog(true)}
            >
              Sign In
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 text-sm text-foreground/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              Secure & Private
            </div>
            <div className="hidden sm:block w-1 h-1 bg-foreground/30 rounded-full" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              Free Forever
            </div>
            <div className="hidden sm:block w-1 h-1 bg-foreground/30 rounded-full" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              Cloud Synced
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold">
              Ready to Start Writing?
            </h2>
            <p className="text-lg text-foreground/70">
              Join thousands of writers who have discovered their creative flow with Noteily
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setShowLoginDialog(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground group"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowLoginDialog(true)}
            >
              Already Have an Account?
            </Button>
          </div>
        </div>
      </section>


      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
