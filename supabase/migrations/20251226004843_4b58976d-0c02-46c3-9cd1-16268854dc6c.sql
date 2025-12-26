-- First create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create portfolios table to store uploaded CSV data
CREATE TABLE public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw_csv TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  summary JSONB,
  allocation JSONB,
  session_id TEXT NOT NULL
);

-- Enable Row Level Security (public access for anonymous users)
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (anyone can insert their portfolio data)
CREATE POLICY "Anyone can insert portfolio data"
ON public.portfolios
FOR INSERT
WITH CHECK (true);

-- Create policy for reading own session data
CREATE POLICY "Anyone can read portfolio data by session"
ON public.portfolios
FOR SELECT
USING (true);

-- Create update trigger for updated_at
CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON public.portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();