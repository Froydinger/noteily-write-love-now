import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { LogIn, UserPlus, Heart } from 'lucide-react';

const AuthPage = () => {
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [notBot, setNotBot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;

    setIsLoading(true);
    const { error } = await signIn(signInEmail, signInPassword);
    
    if (!error) {
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !notBot) return;

    setIsLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword);
    setIsLoading(false);
    
    if (!error) {
      setSignUpEmail('');
      setSignUpPassword('');
      setNotBot(false);
    }
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
            Sign in to sync your notes across all devices
          </CardDescription>
        </CardHeader>
        <CardContent style={{ backgroundColor: 'transparent !important' }}>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList 
              className="grid w-full grid-cols-2" 
              style={{ 
                backgroundColor: 'hsl(215, 45%, 16%) !important', 
                borderColor: 'hsl(215, 45%, 20%) !important',
                border: '1px solid hsl(215, 45%, 20%) !important'
              }}
            >
              <TabsTrigger 
                value="signin" 
                style={{ 
                  color: 'hsl(210, 20%, 60%)',
                  backgroundColor: 'transparent',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                className="
                  data-[state=active]:!bg-[#1EAEDB] 
                  data-[state=active]:!text-white 
                  data-[state=inactive]:!bg-transparent 
                  data-[state=inactive]:!text-gray-400
                  hover:data-[state=inactive]:!bg-gray-800
                "
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                style={{ 
                  color: 'hsl(210, 20%, 60%)',
                  backgroundColor: 'transparent',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                className="
                  data-[state=active]:!bg-[#1EAEDB] 
                  data-[state=active]:!text-white 
                  data-[state=inactive]:!bg-transparent 
                  data-[state=inactive]:!text-gray-400
                  hover:data-[state=inactive]:!bg-gray-800
                "
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    style={{
                      backgroundColor: 'hsl(215, 45%, 20%) !important',
                      borderColor: 'transparent !important',
                      color: 'hsl(210, 40%, 95%) !important',
                      border: 'none !important',
                      outline: 'none !important'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
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
                  type="submit" 
                  className="w-full hover:bg-[#0FA0CE] focus:bg-[#0FA0CE] active:bg-[#0FA0CE]" 
                  disabled={isLoading} 
                  style={{
                    backgroundColor: '#1EAEDB !important',
                    color: '#ffffff !important',
                    borderColor: '#1EAEDB !important',
                    border: '1px solid #1EAEDB !important',
                    fontWeight: '600 !important'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0FA0CE !important';
                    e.currentTarget.style.color = '#ffffff !important';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1EAEDB !important';
                    e.currentTarget.style.color = '#ffffff !important';
                  }}
                >
                  <LogIn className="mr-2 h-4 w-4" style={{ color: '#ffffff !important' }} />
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    style={{
                      backgroundColor: 'hsl(215, 45%, 20%) !important',
                      borderColor: 'transparent !important',
                      color: 'hsl(210, 40%, 95%) !important',
                      border: 'none !important',
                      outline: 'none !important'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Create a password (min 6 characters)"
                    required
                    disabled={isLoading}
                    minLength={6}
                    style={{
                      backgroundColor: 'hsl(215, 45%, 20%) !important',
                      borderColor: 'transparent !important',
                      color: 'hsl(210, 40%, 95%) !important',
                      border: 'none !important',
                      outline: 'none !important'
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="not-bot"
                    checked={notBot}
                    onCheckedChange={(checked) => setNotBot(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="not-bot" className="text-sm font-normal" style={{ color: 'hsl(210, 40%, 95%) !important' }}>
                    I am not a robot
                  </Label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full hover:bg-[#0FA0CE] focus:bg-[#0FA0CE] active:bg-[#0FA0CE]" 
                  disabled={isLoading || !notBot}
                  style={{
                    backgroundColor: '#1EAEDB !important',
                    color: '#ffffff !important',
                    borderColor: '#1EAEDB !important',
                    border: '1px solid #1EAEDB !important',
                    fontWeight: '600 !important'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#0FA0CE !important';
                      e.currentTarget.style.color = '#ffffff !important';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#1EAEDB !important';
                      e.currentTarget.style.color = '#ffffff !important';
                    }
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" style={{ color: '#ffffff !important' }} />
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;