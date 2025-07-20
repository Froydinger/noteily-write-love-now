import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { LogIn, UserPlus, Heart } from 'lucide-react';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentStep, setCurrentStep] = useState<'email' | 'auth'>('email');
  const [authMode, setAuthMode] = useState<'password' | 'magic'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithMagicLink, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEmailSubmit = () => {
    if (!email) return;
    setCurrentStep('auth');
  };

  const handleSignIn = async () => {
    if (!email || !password) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/');
    } else {
      // If sign in fails, try sign up automatically
      const { error: signUpError } = await signUp(email, password);
      if (!signUpError) {
        // Clear form and show success
        setPassword('');
      }
    }
    setIsLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) return;

    setIsLoading(true);
    await signInWithMagicLink(email);
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
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{
        background: 'linear-gradient(180deg, hsl(215, 55%, 18%) 0%, hsl(218, 50%, 14%) 30%, hsl(220, 55%, 10%) 70%, hsl(222, 60%, 7%) 100%) !important',
        backgroundAttachment: 'fixed',
        backgroundColor: 'hsl(215, 45%, 12%) !important'
      }}
    >
      <Card 
        className="w-full max-w-md" 
        style={{
          backgroundColor: 'hsl(215, 45%, 14%) !important',
          borderColor: 'hsl(215, 45%, 20%) !important',
          color: 'hsl(210, 40%, 95%) !important',
          border: '1px solid hsl(215, 45%, 20%) !important'
        }}
      >
        <CardHeader className="text-center" style={{ backgroundColor: 'transparent !important', color: 'hsl(210, 40%, 95%) !important' }}>
          <div className="flex justify-center mb-4">
            <Heart className="h-8 w-8" style={{ color: '#1EAEDB' }} />
          </div>
          <CardTitle className="text-2xl font-serif" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Welcome to Noteily</CardTitle>
          <CardDescription style={{ color: 'hsl(210, 20%, 70%) !important' }}>
            {currentStep === 'email' ? 'Sign in to sync your notes across all devices' : `Continue as ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent style={{ backgroundColor: 'transparent !important' }}>
          {currentStep === 'email' ? (
            // Step 1: Email input + Google
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="Enter your email"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEmailSubmit();
                    }
                  }}
                  style={{
                    backgroundColor: 'hsl(215, 45%, 20%) !important',
                    borderColor: 'transparent !important',
                    color: 'hsl(210, 40%, 95%) !important',
                    border: 'none !important',
                    outline: 'none !important'
                  }}
                />
              </div>
              <Button 
                type="button"
                onClick={handleEmailSubmit}
                className="w-full hover:bg-[#0FA0CE] focus:bg-[#0FA0CE] active:bg-[#0FA0CE]" 
                disabled={isLoading || !email}
                style={{
                  backgroundColor: '#1EAEDB !important',
                  color: '#ffffff !important',
                  borderColor: '#1EAEDB !important',
                  border: '1px solid #1EAEDB !important',
                  fontWeight: '600 !important'
                }}
              >
                Continue
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" style={{ borderColor: 'hsl(215, 45%, 20%) !important' }} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2" style={{ backgroundColor: 'hsl(215, 45%, 14%) !important', color: 'hsl(210, 20%, 70%) !important' }}>
                    Or continue with
                  </span>
                </div>
              </div>

              <Button 
                type="button"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                style={{
                  backgroundColor: '#ffffff !important',
                  borderColor: 'hsl(215, 45%, 20%) !important',
                  color: '#374151 !important',
                  border: '1px solid hsl(215, 45%, 20%) !important',
                  fontWeight: '500 !important'
                }}
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
            // Step 2: Password or Magic Link
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  style={{
                    backgroundColor: 'transparent !important',
                    border: 'none !important',
                    color: 'hsl(210, 40%, 95%) !important',
                    padding: '0 !important',
                    fontSize: '14px !important'
                  }}
                  className="hover:text-blue-400"
                >
                  ← Back
                </Button>
              </div>

              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  className="flex-1"
                  style={{
                    backgroundColor: authMode === 'password' ? '#1EAEDB !important' : 'transparent !important',
                    borderColor: '#1EAEDB !important',
                    color: authMode === 'password' ? '#ffffff !important' : '#1EAEDB !important',
                    border: '1px solid #1EAEDB !important',
                    fontWeight: '500 !important'
                  }}
                >
                  Password
                </Button>
                <Button
                  type="button"
                  onClick={() => setAuthMode('magic')}
                  className="flex-1"
                  style={{
                    backgroundColor: authMode === 'magic' ? '#1EAEDB !important' : 'transparent !important',
                    borderColor: '#1EAEDB !important',
                    color: authMode === 'magic' ? '#ffffff !important' : '#1EAEDB !important',
                    border: '1px solid #1EAEDB !important',
                    fontWeight: '500 !important'
                  }}
                >
                  Magic Link
                </Button>
              </div>

              {authMode === 'password' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSignIn();
                        }
                      }}
                      style={{
                        backgroundColor: 'hsl(215, 45%, 20%) !important',
                        borderColor: 'transparent !important',
                        color: 'hsl(210, 40%, 95%) !important',
                        border: 'none !important',
                        outline: 'none !important'
                      }}
                    />
                  </div>
                  <Button 
                    type="button"
                    onClick={handleSignIn}
                    className="w-full hover:bg-[#0FA0CE] focus:bg-[#0FA0CE] active:bg-[#0FA0CE]" 
                    disabled={isLoading || !password}
                    style={{
                      backgroundColor: '#1EAEDB !important',
                      color: '#ffffff !important',
                      borderColor: '#1EAEDB !important',
                      border: '1px solid #1EAEDB !important',
                      fontWeight: '600 !important'
                    }}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <p style={{ color: 'hsl(210, 40%, 95%) !important' }}>
                      We'll send a magic link to
                    </p>
                    <p className="font-medium" style={{ color: '#1EAEDB !important' }}>
                      {email}
                    </p>
                  </div>
                  <Button 
                    type="button"
                    onClick={handleMagicLink}
                    className="w-full hover:bg-[#0FA0CE] focus:bg-[#0FA0CE] active:bg-[#0FA0CE]" 
                    disabled={isLoading}
                    style={{
                      backgroundColor: '#1EAEDB !important',
                      color: '#ffffff !important',
                      borderColor: '#1EAEDB !important',
                      border: '1px solid #1EAEDB !important',
                      fontWeight: '600 !important'
                    }}
                  >
                    {isLoading ? 'Sending...' : 'Send Magic Link'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;