import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { handleAuthKeyboard } from '@/lib/viewport';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentStep, setCurrentStep] = useState<'choice' | 'email' | 'auth'>('choice');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [shake, setShake] = useState(false);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Handle auth page keyboard
  useEffect(() => {
    const cleanup = handleAuthKeyboard();
    return cleanup;
  }, []);

  const handleChoiceSelection = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setCurrentStep('email');
  };

  const handleEmailSubmit = () => {
    if (!email) return;
    setCurrentStep('auth');
  };

  const handleAuth = async () => {
    if (!email || !password) return;

    setIsLoading(true);
    
    if (authMode === 'signup') {
      // Creating new account
      setIsCreatingAccount(true);
      
      toast({
        title: "Welcome to Noteily! 🎉",
        description: "Creating your account...",
        className: "bg-green-600 text-white border-green-600",
      });
      
      const { error: signUpError } = await signUp(email, password);
      if (!signUpError) {
        setPassword('');
        toast({
          title: "Account created successfully! ✨",
          description: "You're all set to start taking notes.",
          className: "bg-green-600 text-white border-green-600",
        });
      }
      setIsCreatingAccount(false);
    } else {
      // Signing in existing account
      const { error: signInError } = await signIn(email, password);
      
      if (!signInError) {
        navigate('/');
      } else {
        // Trigger shake animation for wrong password
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signInWithGoogle();
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
            {currentStep === 'choice' 
              ? 'Sign in to sync your notes across all devices'
              : currentStep === 'email' 
                ? `${authMode === 'signin' ? 'Sign in to' : 'Create account for'} ${authMode === 'signin' ? 'your account' : 'Noteily'}`
                : `Continue as ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          {currentStep === 'choice' ? (
            // Step 1: Choice between Sign in and Create account
            <div className="space-y-4">
              <Button 
                type="button"
                className="w-full bg-white text-black hover:bg-gray-100 border-0 animate-gentle-sway"
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
              
              <div className="my-6 flex justify-center">
                <span className="text-xs uppercase text-gray-300">
                  Or
                </span>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <Button 
                  type="button"
                  onClick={() => handleChoiceSelection('signin')}
                  size="sm"
                  className="w-48 bg-black text-white hover:bg-gray-800 border-0" 
                  disabled={isLoading}
                >
                  Sign in
                </Button>
                
                <Button 
                  type="button"
                  onClick={() => handleChoiceSelection('signup')}
                  size="sm"
                  className="w-48 bg-black text-white hover:bg-gray-800 border-0" 
                  disabled={isLoading}
                >
                  Create account
                </Button>
              </div>
            </div>
          ) : currentStep === 'email' ? (
            // Step 2: Email input
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="bg-transparent border-0 text-white hover:text-accent px-3 py-2 text-sm rounded-full hover:bg-white/10 transition-all"
                >
                  ← Back
                </Button>
              </div>

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
            </div>
          ) : (
            // Step 3: Password
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="bg-transparent border-0 text-white hover:text-accent px-3 py-2 text-sm rounded-full hover:bg-white/10 transition-all"
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
                    className={`border-0 focus:ring-0 focus:border-0 bg-input text-foreground transition-all ${shake ? 'animate-shake' : ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAuth();
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
                  onClick={handleAuth}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground border-accent" 
                  disabled={isLoading || !password}
                >
                  {isCreatingAccount 
                    ? 'Creating your account...' 
                    : isLoading 
                      ? (authMode === 'signup' ? 'Creating account...' : 'Signing in...') 
                      : (authMode === 'signup' ? 'Create account' : 'Sign in')}
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