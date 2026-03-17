import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentStep, setCurrentStep] = useState<'choice' | 'email' | 'auth'>('choice');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleChoiceSelection = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setCurrentStep('email');
  };

  const handleEmailSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    if (authMode === 'signup' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Use an email to create your account", {
        description: "Sign up requires a valid email address.",
      });
      return;
    }

    setEmail(trimmed);
    setCurrentStep('auth');
  };

  const handleAuth = async () => {
    if (!email || !password) return;

    setIsLoading(true);

    if (authMode === 'signup') {
      toast.success("Welcome to Arcana Notes! 🎉", { description: "Creating your account..." });

      const { error: signUpError } = await signUp(email, password);
      if (!signUpError) {
        setPassword('');
        toast.success("Account created successfully! ✨", { description: "Check your email to confirm." });
        onOpenChange(false);
      }
    } else {
      const { error: signInError } = await signIn(email, password);

      if (!signInError) {
        onOpenChange(false);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    // Don't set isLoading — page redirects away, any state update is irrelevant
    await signInWithGoogle();
  };

  const handleBack = () => {
    if (currentStep === 'auth') {
      setCurrentStep('email');
    } else if (currentStep === 'email') {
      setCurrentStep('choice');
    }
    setPassword('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail('');
      setPassword('');
      setCurrentStep('choice');
      setAuthMode('signin');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-8 w-8 text-accent" />
          </div>
          <DialogTitle className="text-2xl font-serif flex items-center justify-center">
            Welcome to Arcana Notes<span className="text-xs text-muted-foreground ml-0.5 -mt-1">™</span>
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'choice'
              ? 'Sign in or create an account to sync your notes'
              : currentStep === 'email'
                ? `Enter your email to ${authMode === 'signin' ? 'sign in' : 'create an account'}`
                : `Continue as ${email}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentStep === 'choice' ? (
            <div className="space-y-4">
              {/* Google — works for both sign-in and sign-up */}
              <Button
                type="button"
                className="w-full bg-slate-800 text-white hover:bg-slate-700 border-0 google-shimmer"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {authLoading ? 'Redirecting…' : 'Continue with Google'}
              </Button>

              <div className="my-6 flex justify-center">
                <span className="text-xs uppercase text-muted-foreground">
                  Or use email
                </span>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <Button
                  type="button"
                  onClick={() => handleChoiceSelection('signin')}
                  size="sm"
                  className="w-48 bg-black text-white hover:bg-gray-800 border-0"
                >
                  Sign in with email
                </Button>

                <Button
                  type="button"
                  onClick={() => handleChoiceSelection('signup')}
                  size="sm"
                  className="w-48 bg-black text-white hover:bg-gray-800 border-0"
                >
                  Create account with email
                </Button>
              </div>
            </div>
          ) : currentStep === 'email' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button type="button" onClick={handleBack} variant="ghost" size="sm">
                  ← Back
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="Enter your email address"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEmailSubmit();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                onClick={handleEmailSubmit}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={isLoading || !email}
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button type="button" onClick={handleBack} disabled={isLoading} variant="ghost" size="sm">
                  ← Back
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className={`transition-all ${shake ? 'animate-shake' : ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAuth();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAuth}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={isLoading || !password}
                >
                  {isLoading
                    ? (authMode === 'signup' ? 'Creating account...' : 'Signing in...')
                    : (authMode === 'signup' ? 'Create account' : 'Sign in')}
                </Button>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenChange(false);
                      navigate('/forgot-password');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 w-full text-center"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
