-- Create platform_settings table for admin-configurable settings
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage all settings
CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read settings
CREATE POLICY "All users can read platform settings"
ON public.platform_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('google_review_link', 'https://g.page/r/CfNpNpoSIt-1EAI/review'),
  ('google_star_rating', '5.0'),
  ('google_review_count', '24'),
  ('instagram_url', 'https://instagram.com/listd.pro'),
  ('facebook_url', 'https://facebook.com/listd.pro'),
  ('review_email_enabled', 'true'),
  ('tenancies_completed_override', '');

-- Add review_email_sent_at column to jobs table for tracking
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS review_email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Trigger to update updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();