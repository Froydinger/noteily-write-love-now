import { useState, useEffect } from 'react';
import { Heart, ArrowRight, Zap, Lock, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/auth/LoginDialog';

export default function LanderPage() {
  const [scrollY, setScrollY] = useState(0);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'Beautiful Writing',
      description: 'A distraction-free experience designed for writers who love their craft',
      color: 'from-cyan-500/20 to-cyan-500/5'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant syncing across all your devices with zero lag',
      color: 'from-purple-500/20 to-purple-500/5'
    },
    {
      icon: Lock,
      title: 'Private & Secure',
      description: 'Your notes are encrypted and only you can access them',
      color: 'from-emerald-500/20 to-emerald-500/5'
    },
    {
      icon: Share2,
      title: 'Collaborate Easily',
      description: 'Share notes with friends and collaborate in real-time',
      color: 'from-pink-500/20 to-pink-500/5'
    }
  ];

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
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32 max-w-6xl mx-auto overflow-hidden">
        {/* Parallax background elements with enhanced glow */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none shadow-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(0, 217, 255, 0.15), rgba(0, 217, 255, 0) 70%)',
            transform: `translateY(${scrollY * 0.5}px)`,
            zIndex: -10,
            filter: 'drop-shadow(0 0 60px rgba(0, 217, 255, 0.3))'
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0) 70%)',
            transform: `translateY(${scrollY * 0.3}px)`,
            zIndex: -10,
            filter: 'drop-shadow(0 0 40px rgba(168, 85, 247, 0.2))'
          }}
        />

        <div className="relative text-center space-y-8 animate-fade-in z-10">
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
              Free to Start
            </div>
            <div className="hidden sm:block w-1 h-1 bg-foreground/30 rounded-full" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              Cloud Synced
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Noteily is packed with features to enhance your writing journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl p-8 backdrop-blur-xl border border-border/50 bg-gradient-to-br ${feature.color} hover:border-accent/50 transition-all duration-300 hover:shadow-lg`}
                  style={{
                    animation: `float-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.1}s both`
                  }}
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10 space-y-4">
                    <div className="inline-flex p-3 rounded-xl bg-background/40 group-hover:bg-accent/20 transition-colors">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-serif font-semibold">{feature.title}</h3>
                    <p className="text-foreground/70">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-border/50 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '10K+', label: 'Active Writers' },
              { number: '50M+', label: 'Notes Created' },
              { number: '99.9%', label: 'Uptime' },
              { number: '∞', label: 'Possibilities' }
            ].map((stat, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-3xl sm:text-4xl font-bold text-accent mb-2">{stat.number}</div>
                <div className="text-sm text-foreground/60">{stat.label}</div>
              </div>
            ))}
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

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-5 w-5 text-accent" fill="currentColor" />
                <span className="font-semibold">Noteily</span>
              </div>
              <p className="text-sm text-foreground/60">Write what you love</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="/terms" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Discord</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/30 pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-foreground/60">
            <p>&copy; 2025 Noteily. All rights reserved.</p>
            <p>Built with ❤️ for writers</p>
          </div>
        </div>
      </footer>

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
