import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Mail, Wand2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentStep, setCurrentStep] = useState<'choice' | 'email' | 'auth' | 'magic-sent'>('choice');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { signIn, signUp, signInWithApple, signInWithMagicLink, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleChoiceSelection = (mode: 'signin' | 'signup' | 'magiclink') => {
    setAuthMode(mode);
    setCurrentStep('email');
  };

  const handleEmailSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setEmail(trimmed);

    if (authMode === 'magiclink') {
      setIsLoading(true);
      const { error } = await signInWithMagicLink(trimmed);
      setIsLoading(false);
      if (!error) {
        setCurrentStep('magic-sent');
      }
    } else {
      setCurrentStep('auth');
    }
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

  const handleAppleSignIn = async () => {
    await signInWithApple();
  };

  const handleBack = () => {
    if (currentStep === 'auth' || currentStep === 'magic-sent') {
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
              : currentStep === 'magic-sent'
                ? 'Check your inbox for the magic link'
                : currentStep === 'email'
                  ? authMode === 'magiclink'
                    ? 'Enter your email and we\'ll send you a magic link'
                    : `Enter your email to ${authMode === 'signin' ? 'sign in' : 'create an account'}`
                  : `Continue as ${email}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentStep === 'choice' ? (
            <div className="space-y-4">
              {/* Apple Sign In */}
              <Button
                type="button"
                className="w-full bg-black text-white hover:bg-gray-900 border-0"
                onClick={handleAppleSignIn}
                disabled={authLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                {authLoading ? 'Redirecting…' : 'Continue with Apple'}
              </Button>

              <div className="my-6 flex justify-center">
                <span className="text-xs uppercase text-muted-foreground">
                  Or use email
                </span>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <Button
                  type="button"
                  onClick={() => handleChoiceSelection('magiclink')}
                  size="sm"
                  variant="outline"
                  className="w-48"
                >
                  <Wand2 className="mr-2 h-3.5 w-3.5" />
                  Magic link
                </Button>

                <Button
                  type="button"
                  onClick={() => handleChoiceSelection('signin')}
                  size="sm"
                  variant="outline"
                  className="w-48"
                >
                  <Mail className="mr-2 h-3.5 w-3.5" />
                  Sign in with email
                </Button>

                <Button
                  type="button"
                  onClick={() => handleChoiceSelection('signup')}
                  size="sm"
                  variant="outline"
                  className="w-48"
                >
                  <Mail className="mr-2 h-3.5 w-3.5" />
                  Create account
                </Button>
              </div>
            </div>
          ) : currentStep === 'magic-sent' ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center gap-2 mb-4">
                <Button type="button" onClick={handleBack} variant="ghost" size="sm">
                  ← Back
                </Button>
              </div>
              <Wand2 className="h-10 w-10 text-accent mx-auto" />
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <strong className="text-foreground">{email}</strong>. Click the link in that email to sign in.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleOpenChange(false);
                }}
              >
                Done
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
                {isLoading ? 'Sending...' : authMode === 'magiclink' ? 'Send magic link' : 'Continue'}
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
