import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Lock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenProcessed, setTokenProcessed] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Extract tokens from both query params and hash fragments
  const getTokensFromUrl = () => {
    // Try query parameters first (new format)
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    // Try legacy format
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    // Try hash fragments (sometimes Supabase uses these)
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const hashToken = hashParams.get('access_token');
    const hashRefreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type');
    
    console.log('Token extraction:', { 
      query: { token, type, accessToken, refreshToken },
      hash: { hashToken, hashRefreshToken, hashType }
    });
    
    return {
      // New format
      token,
      type,
      // Legacy format
      accessToken: accessToken || hashToken,
      refreshToken: refreshToken || hashRefreshToken,
      recoveryType: type || hashType
    };
  };

  const tokens = getTokensFromUrl();

  // Process tokens when component mounts
  useEffect(() => {
    const processTokens = async () => {
      if (tokenProcessed) return;
      
      console.log('Processing tokens:', tokens);
      
      // Check if this is a password reset link
      if (tokens.recoveryType !== 'recovery' && !tokens.token && !tokens.accessToken) {
        setTokenError("This password reset link is invalid or has expired.");
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Handle new token format (PKCE)
        if (tokens.token && tokens.recoveryType === 'recovery') {
          console.log('Processing new token format');
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokens.token,
            type: 'recovery'
          });
          
          if (error) {
            console.error('Token verification error:', error);
            setTokenError(`Token verification failed: ${error.message}`);
            return;
          }
        }
        // Handle legacy format
        else if (tokens.accessToken && tokens.refreshToken) {
          console.log('Processing legacy token format');
          const { error } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          });
          
          if (error) {
            console.error('Session error:', error);
            setTokenError(`Session error: ${error.message}`);
            return;
          }
        } else {
          setTokenError("No valid tokens found in the reset link.");
          return;
        }
        
        setTokenProcessed(true);
        console.log('Token processing successful');
        
      } catch (err) {
        console.error('Token processing error:', err);
        setTokenError("An unexpected error occurred while processing the reset link.");
      } finally {
        setIsLoading(false);
      }
    };
    
    processTokens();
  }, [tokens.token, tokens.accessToken, tokens.refreshToken, tokens.recoveryType, tokenProcessed]);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!tokenProcessed) {
      toast({
        title: "Session not ready",
        description: "Please wait for the reset link to be processed.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update the password (session should already be established from token processing)
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated successfully",
          description: "You can now sign in with your new password.",
        });
        navigate('/');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewReset = () => {
    navigate('/forgot-password');
  };

  // Show error state if tokens are invalid
  if (tokenError) {
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
            <CardTitle className="text-2xl font-serif" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Reset Link Invalid</CardTitle>
            <CardDescription style={{ color: 'hsl(210, 20%, 70%) !important' }}>
              {tokenError}
            </CardDescription>
          </CardHeader>
          <CardContent style={{ backgroundColor: 'transparent !important' }}>
            <div className="space-y-4">
              <Button 
                type="button"
                onClick={handleRequestNewReset}
                className="w-full hover:bg-[#0FA0CE] focus:bg-[#0FA0CE] active:bg-[#0FA0CE]" 
                style={{
                  backgroundColor: '#1EAEDB !important',
                  color: '#ffffff !important',
                  borderColor: '#1EAEDB !important',
                  border: '1px solid #1EAEDB !important',
                  fontWeight: '600 !important'
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" style={{ color: '#ffffff !important' }} />
                Request New Reset Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-2xl font-serif" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Reset Your Password</CardTitle>
          <CardDescription style={{ color: 'hsl(210, 20%, 70%) !important' }}>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent style={{ backgroundColor: 'transparent !important' }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: 'hsl(210, 40%, 95%) !important' }}>New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
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
              <Label htmlFor="confirmPassword" style={{ color: 'hsl(210, 40%, 95%) !important' }}>Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleResetPassword();
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
              onClick={handleResetPassword}
              className="w-full hover:bg-[#0FA0CE] focus:bg-[#0FA0CE] active:bg-[#0FA0CE]" 
              disabled={isLoading || !password || !confirmPassword || !tokenProcessed}
              style={{
                backgroundColor: '#1EAEDB !important',
                color: '#ffffff !important',
                borderColor: '#1EAEDB !important',
                border: '1px solid #1EAEDB !important',
                fontWeight: '600 !important'
              }}
            >
              <Lock className="mr-2 h-4 w-4" style={{ color: '#ffffff !important' }} />
              {isLoading ? 'Updating Password...' : !tokenProcessed ? 'Processing Reset Link...' : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;