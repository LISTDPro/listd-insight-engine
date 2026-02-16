-- Create property type enum
CREATE TYPE public.property_type AS ENUM ('studio', '1_bed', '2_bed', '3_bed', '4_bed', '5_bed', '6_bed', '7_bed', '8_bed', '9_bed');

-- Create furnished status enum
CREATE TYPE public.furnished_status AS ENUM ('furnished', 'unfurnished', 'part_furnished');

-- Create inspection type enum
CREATE TYPE public.inspection_type AS ENUM ('new_inventory', 'check_in', 'check_out', 'mid_term', 'interim');

-- Create job status enum
CREATE TYPE public.job_status AS ENUM ('draft', 'pending', 'published', 'accepted', 'assigned', 'in_progress', 'submitted', 'reviewed', 'signed', 'completed', 'paid', 'cancelled');

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  property_type public.property_type NOT NULL DEFAULT 'studio',
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  kitchens INTEGER NOT NULL DEFAULT 1,
  living_rooms INTEGER NOT NULL DEFAULT 1,
  dining_areas INTEGER NOT NULL DEFAULT 0,
  furnished_status public.furnished_status NOT NULL DEFAULT 'unfurnished',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES auth.users(id),
  clerk_id UUID REFERENCES auth.users(id),
  inspection_type public.inspection_type NOT NULL,
  scheduled_date DATE NOT NULL,
  preferred_time_slot TEXT,
  status public.job_status NOT NULL DEFAULT 'draft',
  special_instructions TEXT,
  quoted_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Properties RLS policies
CREATE POLICY "Clients can view their own properties"
ON public.properties FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert their own properties"
ON public.properties FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own properties"
ON public.properties FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own properties"
ON public.properties FOR DELETE
USING (auth.uid() = client_id);

-- Jobs RLS policies
CREATE POLICY "Clients can view their own jobs"
ON public.jobs FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Providers can view jobs assigned to them"
ON public.jobs FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Clerks can view jobs assigned to them"
ON public.jobs FOR SELECT
USING (auth.uid() = clerk_id);

CREATE POLICY "Clients can insert their own jobs"
ON public.jobs FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own jobs"
ON public.jobs FOR UPDATE
USING (auth.uid() = client_id);

-- Update triggers
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();