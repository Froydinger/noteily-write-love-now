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
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(180deg, hsl(215, 55%, 18%) 0%, hsl(218, 50%, 14%) 30%, hsl(220, 55%, 10%) 70%, hsl(222, 60%, 7%) 100%)',
      backgroundAttachment: 'fixed'
    }}>
      <Card className="w-full max-w-md" style={{
        backgroundColor: 'hsl(215, 45%, 14%)',
        borderColor: 'hsl(215, 45%, 20%)',
        color: 'hsl(210, 40%, 95%)'
      }}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-8 w-8" style={{ color: '#1EAEDB' }} />
          </div>
          <CardTitle className="text-2xl font-serif" style={{ color: 'hsl(210, 40%, 95%)' }}>Welcome to Noteily</CardTitle>
          <CardDescription style={{ color: 'hsl(210, 20%, 70%)' }}>
            Sign in to sync your notes across all devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2" style={{ 
              backgroundColor: 'hsl(215, 45%, 16%)', 
              borderColor: 'hsl(215, 45%, 20%)' 
            }}>
              <TabsTrigger value="signin" style={{ color: 'hsl(210, 40%, 95%)' }}>Sign In</TabsTrigger>
              <TabsTrigger value="signup" style={{ color: 'hsl(210, 40%, 95%)' }}>Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" style={{ color: 'hsl(210, 40%, 95%)' }}>Email</Label>
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
                      backgroundColor: 'hsl(215, 45%, 20%)',
                      borderColor: 'hsl(215, 45%, 20%)',
                      color: 'hsl(210, 40%, 95%)'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" style={{ color: 'hsl(210, 40%, 95%)' }}>Password</Label>
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
                      backgroundColor: 'hsl(215, 45%, 20%)',
                      borderColor: 'hsl(215, 45%, 20%)',
                      color: 'hsl(210, 40%, 95%)'
                    }}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} style={{
                  backgroundColor: '#1EAEDB',
                  color: 'hsl(215, 45%, 12%)',
                  borderColor: '#1EAEDB'
                }}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" style={{ color: 'hsl(210, 40%, 95%)' }}>Email</Label>
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
                      backgroundColor: 'hsl(215, 45%, 20%)',
                      borderColor: 'hsl(215, 45%, 20%)',
                      color: 'hsl(210, 40%, 95%)'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" style={{ color: 'hsl(210, 40%, 95%)' }}>Password</Label>
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
                      backgroundColor: 'hsl(215, 45%, 20%)',
                      borderColor: 'hsl(215, 45%, 20%)',
                      color: 'hsl(210, 40%, 95%)'
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
                  <Label htmlFor="not-bot" className="text-sm font-normal" style={{ color: 'hsl(210, 40%, 95%)' }}>
                    I am not a robot
                  </Label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !notBot}
                  style={{
                    backgroundColor: '#1EAEDB',
                    color: 'hsl(215, 45%, 12%)',
                    borderColor: '#1EAEDB'
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
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