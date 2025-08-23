import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  // Temporarily disabled to debug routing issue
  // useEffect(() => {
  //   // Redirect if already logged in
  //   if (user) {
  //     navigate('/');
  //   }
  // }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);
    const { error } = await requestPasswordReset(identifier.trim());
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setIdentifier('');
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              If an account exists with the username or email you provided, you'll receive password reset instructions shortly.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  setSent(false);
                  setError(null);
                  setIdentifier('');
                }}
                variant="outline"
                className="w-full"
              >
                Send another email
              </Button>
              
              <Link to="/">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <p className="text-muted-foreground">
            Enter your username or email address and we'll send you a link to reset your password.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>{error}</p>
                  {error.includes('Google') && (
                    <p className="text-sm">
                      Try signing in with Google instead, or contact support if you need to reset your Google account password.
                    </p>
                  )}
                  {error.includes('not found') && (
                    <div className="flex gap-2 mt-2">
                      <Button 
                        onClick={handleTryAgain}
                        variant="outline"
                        size="sm"
                      >
                        Try different username/email
                      </Button>
                      <Link to="/">
                        <Button variant="outline" size="sm">
                          Create account instead
                        </Button>
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="identifier">Username or Email</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter your username or email"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                }}
                required
                autoComplete="username email"
                autoFocus
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !identifier.trim()}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/">
              <Button variant="ghost" className="text-sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to sign in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}