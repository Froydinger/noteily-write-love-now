import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Heart } from 'lucide-react';

const OTP_TYPES = new Set<EmailOtpType>(['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']);

function getOtpParams() {
  const url = new URL(window.location.href);
  return {
    tokenHash: url.searchParams.get('token_hash') ?? url.searchParams.get('token'),
    type: url.searchParams.get('type'),
  };
}

/**
 * This page handles EMAIL-ONLY auth flows: email confirmation, magic links,
 * password recovery, invite links. Google OAuth is handled by the managed
 * Lovable auth bridge on the root route (/) and should never land here.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const completeAuth = async () => {
      try {
        // Check for error params first
        const url = new URL(window.location.href);
        const errorParam = url.searchParams.get('error') || url.searchParams.get('error_description');
        if (errorParam) {
          throw new Error(url.searchParams.get('error_description') || errorParam);
        }

        const { tokenHash, type } = getOtpParams();

        if (tokenHash && type && OTP_TYPES.has(type as EmailOtpType)) {
          // Email OTP verification (signup confirmation, magic link, recovery, etc.)
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });
          if (error) throw error;
        } else {
          // No OTP params — check if there's already an active session
          // (e.g. user navigated here directly)
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            throw new Error('Unable to complete sign in. Please try again.');
          }
        }

        // Clean URL and navigate to app
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/home', { replace: true });
      } catch (err: any) {
        console.error('[AuthCallback] Failed to complete auth', err);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (isActive) {
          setError(err?.message ?? 'Unable to complete sign in. Please try again.');
        }
      }
    };

    void completeAuth();

    return () => { isActive = false; };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border/60 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Heart className="h-8 w-8 text-accent" fill="currentColor" />
            </div>
            <CardTitle>Authentication failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Heart className="h-8 w-8 text-accent" fill="currentColor" />
          </div>
          <CardTitle>Finishing sign in</CardTitle>
          <CardDescription>We're confirming your email and sending you into the app.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <LoadingSpinner size="lg" text="Signing you in..." />
        </CardContent>
      </Card>
    </div>
  );
}
