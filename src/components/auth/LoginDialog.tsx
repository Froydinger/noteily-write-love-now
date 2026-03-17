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
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleChoiceSelection = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setCurrentStep('email');
  };

  const handleEmailSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
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
            <div className="flex flex-col items-center space-y-3">
              <Button
                type="button"
                onClick={() => handleChoiceSelection('signin')}
                className="w-64 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Sign in
              </Button>

              <Button
                type="button"
                onClick={() => handleChoiceSelection('signup')}
                variant="outline"
                className="w-64"
              >
                Create account
              </Button>
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
