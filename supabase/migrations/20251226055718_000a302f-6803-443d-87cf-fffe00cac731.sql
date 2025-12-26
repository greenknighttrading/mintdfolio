-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert portfolio data" ON public.portfolios;
DROP POLICY IF EXISTS "Anyone can read portfolio data by session" ON public.portfolios;

-- Create proper RLS policies using anonymous auth (auth.uid())
-- Users can only read their own portfolio data
CREATE POLICY "Users can read own portfolio data"
ON public.portfolios
FOR SELECT
USING (session_id = auth.uid()::text);

-- Users can only insert their own portfolio data
CREATE POLICY "Users can insert own portfolio data"
ON public.portfolios
FOR INSERT
WITH CHECK (session_id = auth.uid()::text);

-- Users can only update their own portfolio data
CREATE POLICY "Users can update own portfolio data"
ON public.portfolios
FOR UPDATE
USING (session_id = auth.uid()::text)
WITH CHECK (session_id = auth.uid()::text);

-- Users can only delete their own portfolio data
CREATE POLICY "Users can delete own portfolio data"
ON public.portfolios
FOR DELETE
USING (session_id = auth.uid()::text);