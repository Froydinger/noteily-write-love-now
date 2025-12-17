import { useState } from 'react';
import { Heart, ArrowRight, Zap, Lock, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/auth/LoginDialog';

export default function LanderPage() {
  const [showLoginDialog, setShowLoginDialog] = useState(false);

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
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/30 pwa-safe-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 group-hover:from-accent/40 group-hover:to-accent/20 transition-all duration-300 shadow-lg shadow-accent/10">
              <Heart className="h-6 w-6 text-accent animate-heartbeat" fill="currentColor" />
            </div>
            <span className="text-lg font-display font-semibold tracking-tight">Noteily</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLoginDialog(true)}
              className="hover:bg-accent/10"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => setShowLoginDialog(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-36 max-w-6xl mx-auto">
        <div className="relative text-center space-y-10">
          {/* Logo with glow effect */}
          <div className="flex justify-center animate-fade-in">
            <div className="relative">
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-3xl bg-accent/30 blur-2xl animate-pulse-slow scale-150" />
              <div className="absolute inset-0 rounded-3xl bg-accent/20 blur-xl animate-pulse-slow animation-delay-1000 scale-125" />
              
              <div className="relative p-5 rounded-3xl bg-gradient-to-br from-accent/25 to-accent/5 backdrop-blur-xl border border-accent/30 shadow-2xl shadow-accent/20 animate-float">
                <Heart className="h-24 w-24 text-accent animate-heartbeat" fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Title with staggered animation */}
          <div className="space-y-6">
            <h1 
              className="text-5xl sm:text-6xl lg:text-8xl font-serif font-bold tracking-tight animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              Write What You{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-accent via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Love
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-accent via-pink-400 to-purple-400 rounded-full opacity-50 blur-sm" />
              </span>
            </h1>
            <p 
              className="text-xl sm:text-2xl text-foreground/70 font-light max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              The note-taking app designed for passionate writers. Beautiful, fast, and built for your creative flow.
            </p>
          </div>

          {/* CTA Buttons with hover effects */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <Button
              size="lg"
              onClick={() => setShowLoginDialog(true)}
              className="relative bg-accent hover:bg-accent/90 text-accent-foreground group overflow-hidden shadow-xl shadow-accent/30 hover:shadow-2xl hover:shadow-accent/40 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                Start Writing
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowLoginDialog(true)}
              className="border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 hover:scale-105"
            >
              Sign In
            </Button>
          </div>

          {/* Trust badges with animations */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10 text-sm text-foreground/60 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            {[
              'Secure & Private',
              'Free Forever', 
              'Cloud Synced'
            ].map((badge, i) => (
              <div key={badge} className="flex items-center gap-2 group">
                <div className="w-2 h-2 bg-accent rounded-full group-hover:scale-125 transition-transform shadow-lg shadow-accent/50" />
                <span className="group-hover:text-foreground/80 transition-colors">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-36 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Everything You Need
            </h2>
            <p className="text-lg sm:text-xl text-foreground/60 max-w-2xl mx-auto">
              Noteily is packed with features to enhance your writing journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-3xl p-8 lg:p-10 backdrop-blur-xl border border-border/40 bg-gradient-to-br ${feature.color} hover:border-accent/50 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/10 hover:-translate-y-1`}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 space-y-5">
                    <div className="inline-flex p-4 rounded-2xl bg-background/50 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110 shadow-lg">
                      <Icon className="h-7 w-7 text-accent" />
                    </div>
                    <h3 className="text-2xl font-serif font-semibold">{feature.title}</h3>
                    <p className="text-foreground/70 text-lg leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-36 px-4 sm:px-6 lg:px-8 relative z-20">
        {/* Spotlight effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-2xl mx-auto text-center space-y-10">
          <div className="space-y-6">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold">
              Ready to Start Writing?
            </h2>
            <p className="text-lg sm:text-xl text-foreground/70">
              Join thousands of writers who have discovered their creative flow with Noteily
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setShowLoginDialog(true)}
              className="relative bg-accent hover:bg-accent/90 text-accent-foreground group overflow-hidden shadow-xl shadow-accent/30 hover:shadow-2xl hover:shadow-accent/40 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowLoginDialog(true)}
              className="border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 hover:scale-105"
            >
              Already Have an Account?
            </Button>
          </div>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-20" />

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-blob {
          animation: blob 10s ease-in-out infinite;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
