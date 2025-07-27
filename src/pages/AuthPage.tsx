import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { handleViewportResize } from '@/lib/viewport';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentStep, setCurrentStep] = useState<'email' | 'auth'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [willCreateAccount, setWillCreateAccount] = useState(false);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Handle viewport changes for mobile keyboard
  useEffect(() => {
    const cleanup = handleViewportResize();
    return cleanup;
  }, []);

  const handleEmailSubmit = async () => {
    if (!email) return;
    
    // Try a quick sign-in attempt with a dummy password to check if user exists
    const { error } = await signIn(email, 'dummy-password-check');
    
    if (error && error.message.includes('Invalid login credentials')) {
      // User doesn't exist, this will be a sign-up
      setWillCreateAccount(true);
    } else {
      // User exists or other error (like wrong password, which means user exists)
      setWillCreateAccount(false);
    }
    
    setCurrentStep('auth');
  };

  const handleSignIn = async () => {
    if (!email || !password) return;

    setIsLoading(true);
    setIsCreatingAccount(false);
    
    // First try to sign in
    const { error: signInError } = await signIn(email, password);
    
    if (!signInError) {
      // Sign in successful
      navigate('/');
    } else {
      // If sign in fails with "Invalid login credentials", try to create account
      if (signInError.message.includes('Invalid login credentials')) {
        setIsCreatingAccount(true);
        setWillCreateAccount(true);
        const { error: signUpError } = await signUp(email, password);
        if (!signUpError) {
          setPassword('');
        }
        setIsCreatingAccount(false);
      }
      // For other errors (like "Email not confirmed"), let the original error show
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signInWithGoogle();
    setIsLoading(false);
  };

  const handleBack = () => {
    setCurrentStep('email');
    setPassword('');
    setWillCreateAccount(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-background" 
      style={{
        background: 'linear-gradient(180deg, hsl(215, 55%, 18%) 0%, hsl(218, 50%, 14%) 30%, hsl(220, 55%, 10%) 70%, hsl(222, 60%, 7%) 100%)',
        backgroundAttachment: 'fixed',
        backgroundColor: 'hsl(215, 45%, 12%)'
      }}
    >
      <Card 
        className="w-full max-w-md border-0 bg-card text-card-foreground" 
        style={{
          backgroundColor: 'hsl(215, 45%, 14%)',
          border: 'none',
          boxShadow: 'none'
        }}
      >
        <CardHeader className="text-center bg-transparent text-card-foreground">
          <div className="flex justify-center mb-4">
            <Heart className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-serif text-white">Welcome to Noteily</CardTitle>
          <CardDescription className="text-gray-300">
            {currentStep === 'email' 
              ? 'Sign in to sync your notes across all devices' 
              : willCreateAccount 
                ? `Create your account with ${email}` 
                : `Sign in as ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          {currentStep === 'email' ? (
            // Step 1: Email input + Google
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="Enter your email"
                  disabled={isLoading}
                  className="border-0 focus:ring-0 focus:border-0 bg-input text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEmailSubmit();
                    }
                  }}
                  style={{
                    backgroundColor: 'hsl(215, 45%, 20%)',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                />
              </div>
              <Button 
                type="button"
                onClick={handleEmailSubmit}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground border-accent" 
                disabled={isLoading || !email}
              >
                Continue
              </Button>
              
              <div className="my-4 flex justify-center">
                <span className="text-xs uppercase text-gray-300">
                  Or continue with
                </span>
              </div>

              <Button 
                type="button"
                className="w-full border-0 bg-transparent text-white hover:bg-secondary/50"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          ) : (
            // Step 2: Password
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="bg-transparent border-0 text-white hover:text-accent p-0 text-sm"
                >
                  ← Back
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="border-0 focus:ring-0 focus:border-0 bg-input text-foreground"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSignIn();
                      }
                    }}
                    style={{
                      backgroundColor: 'hsl(215, 45%, 20%)',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  />
                </div>
                <Button 
                  type="button"
                  onClick={handleSignIn}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground border-accent" 
                  disabled={isLoading || !password}
                >
                  {isCreatingAccount 
                    ? 'Creating your account...' 
                    : isLoading 
                      ? (willCreateAccount ? 'Creating account...' : 'Signing in...') 
                      : (willCreateAccount ? 'Create account' : 'Sign in')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;