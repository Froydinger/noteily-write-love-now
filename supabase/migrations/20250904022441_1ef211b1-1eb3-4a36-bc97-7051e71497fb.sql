-- Fix critical security vulnerabilities in subscribers table RLS policies

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create secure policies that only allow users to access their own data
CREATE POLICY "users_can_view_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Edge functions will use service role key to bypass RLS entirely
-- No separate policies needed for edge functions

-- Ensure user_id is not nullable for security
ALTER TABLE public.subscribers ALTER COLUMN user_id SET NOT NULL;