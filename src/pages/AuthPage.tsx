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
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [notBot, setNotBot] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, signInWithGoogle, user, resetPassword } = useAuth();
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
    if (!signUpEmail || !signUpPassword || !notBot || !agreeTerms) return;

    setIsLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword);
    setIsLoading(false);
    
    if (!error) {
      setSignUpEmail('');
      setSignUpPassword('');
      setNotBot(false);
      setAgreeTerms(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signInWithGoogle();
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!resetEmail) return;

    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(resetEmail);
      if (!error) {
        setResetSent(true);
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
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
                 
                 <div className="text-center mt-3">
                   <button
                     type="button"
                     onClick={() => setShowResetForm(!showResetForm)}
                     className="text-sm text-blue-400 hover:text-blue-300 underline"
                     disabled={isLoading}
                   >
                     Forgot your password?
                   </button>
                 </div>

                 {showResetForm && (
                   <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'hsl(215, 45%, 16%) !important' }}>
                     {!resetSent ? (
                       <form onSubmit={handleResetPassword} className="space-y-3">
                         <Label htmlFor="reset-email" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Reset Password</Label>
                         <Input
                           id="reset-email"
                           type="email"
                           value={resetEmail}
                           onChange={(e) => setResetEmail(e.target.value)}
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
                         <div className="flex gap-2">
                           <Button 
                             type="submit" 
                             className="flex-1"
                             disabled={isLoading}
                             style={{
                               backgroundColor: '#1EAEDB !important',
                               color: '#ffffff !important',
                               fontWeight: '500 !important'
                             }}
                           >
                             {isLoading ? 'Sending...' : 'Send Reset Email'}
                           </Button>
                           <Button 
                             type="button" 
                             onClick={() => {
                               setShowResetForm(false);
                               setResetSent(false);
                               setResetEmail('');
                             }}
                             className="flex-1"
                             disabled={isLoading}
                             style={{
                               backgroundColor: 'transparent !important',
                               borderColor: 'hsl(215, 45%, 30%) !important',
                               color: 'hsl(210, 40%, 95%) !important',
                               border: '1px solid hsl(215, 45%, 30%) !important'
                             }}
                           >
                             Cancel
                           </Button>
                         </div>
                       </form>
                     ) : (
                       <div className="text-center space-y-3">
                         <div className="text-green-400 text-lg">✓</div>
                         <div style={{ color: 'hsl(210, 40%, 95%) !important' }}>
                           <strong>Check your email!</strong>
                         </div>
                         <p className="text-sm" style={{ color: 'hsl(210, 20%, 70%) !important' }}>
                           We've sent password reset instructions to <strong>{resetEmail}</strong>
                         </p>
                         <Button 
                           type="button" 
                           onClick={() => {
                             setShowResetForm(false);
                             setResetSent(false);
                             setResetEmail('');
                           }}
                           className="w-full"
                           style={{
                             backgroundColor: 'transparent !important',
                             borderColor: 'hsl(215, 45%, 30%) !important',
                             color: 'hsl(210, 40%, 95%) !important',
                             border: '1px solid hsl(215, 45%, 30%) !important'
                           }}
                         >
                           Done
                         </Button>
                       </div>
                     )}
                   </div>
                 )}
                
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
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#f9fafb !important';
                      e.currentTarget.style.color = '#374151 !important';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#ffffff !important';
                      e.currentTarget.style.color = '#374151 !important';
                    }
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
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="agree-terms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <Label htmlFor="agree-terms" className="text-sm font-normal leading-relaxed" style={{ color: 'hsl(210, 40%, 95%) !important' }}>
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-400 hover:text-blue-300 underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full hover:bg-[#0FA0CE] focus:bg-[#0FA0CE] active:bg-[#0FA0CE]" 
                  disabled={isLoading || !notBot || !agreeTerms}
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
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#f9fafb !important';
                      e.currentTarget.style.color = '#374151 !important';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#ffffff !important';
                      e.currentTarget.style.color = '#374151 !important';
                    }
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
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;