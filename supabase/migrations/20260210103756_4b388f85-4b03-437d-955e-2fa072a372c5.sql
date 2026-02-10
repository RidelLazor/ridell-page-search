
CREATE TABLE public.waitlist_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (no auth required for waitlist)
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist_emails
FOR INSERT
WITH CHECK (true);

-- Only service role can read
CREATE POLICY "Service role can read waitlist"
ON public.waitlist_emails
FOR SELECT
USING (false);
