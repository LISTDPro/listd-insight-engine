-- Create condition rating enum
CREATE TYPE public.condition_rating AS ENUM ('excellent', 'good', 'fair', 'poor', 'damaged', 'missing', 'na');

-- Create room type enum
CREATE TYPE public.room_type AS ENUM (
  'entrance', 'hallway', 'living_room', 'dining_room', 'kitchen', 
  'bedroom', 'bathroom', 'toilet', 'utility', 'storage', 
  'garden', 'garage', 'balcony', 'other'
);

-- Create inspection reports table
CREATE TABLE public.inspection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  clerk_id UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  general_notes TEXT,
  meter_readings JSONB DEFAULT '{}',
  keys_info JSONB DEFAULT '{}',
  smoke_alarms_checked BOOLEAN DEFAULT false,
  carbon_monoxide_checked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection rooms table
CREATE TABLE public.inspection_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  room_type public.room_type NOT NULL,
  room_name TEXT NOT NULL,
  room_order INTEGER NOT NULL DEFAULT 0,
  overall_condition public.condition_rating,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection items table (fixtures, appliances, etc.)
CREATE TABLE public.inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.inspection_rooms(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_category TEXT,
  item_order INTEGER NOT NULL DEFAULT 0,
  condition public.condition_rating,
  condition_notes TEXT,
  cleanliness public.condition_rating,
  cleanliness_notes TEXT,
  quantity INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection photos table
CREATE TABLE public.inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.inspection_rooms(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inspection_items(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_mandatory BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;

-- Inspection Reports RLS - Clerks can manage their own reports
CREATE POLICY "Clerks can view their own reports"
ON public.inspection_reports FOR SELECT
USING (auth.uid() = clerk_id);

CREATE POLICY "Clerks can insert their own reports"
ON public.inspection_reports FOR INSERT
WITH CHECK (auth.uid() = clerk_id);

CREATE POLICY "Clerks can update their own reports"
ON public.inspection_reports FOR UPDATE
USING (auth.uid() = clerk_id);

-- Clients can view reports for their jobs
CREATE POLICY "Clients can view reports for their jobs"
ON public.inspection_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = inspection_reports.job_id 
    AND jobs.client_id = auth.uid()
  )
);

-- Inspection Rooms RLS
CREATE POLICY "Clerks can manage rooms in their reports"
ON public.inspection_rooms FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.inspection_reports 
    WHERE inspection_reports.id = inspection_rooms.report_id 
    AND inspection_reports.clerk_id = auth.uid()
  )
);

CREATE POLICY "Clients can view rooms for their jobs"
ON public.inspection_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.inspection_reports ir
    JOIN public.jobs j ON j.id = ir.job_id
    WHERE ir.id = inspection_rooms.report_id 
    AND j.client_id = auth.uid()
  )
);

-- Inspection Items RLS
CREATE POLICY "Clerks can manage items in their reports"
ON public.inspection_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.inspection_rooms r
    JOIN public.inspection_reports ir ON ir.id = r.report_id
    WHERE r.id = inspection_items.room_id 
    AND ir.clerk_id = auth.uid()
  )
);

CREATE POLICY "Clients can view items for their jobs"
ON public.inspection_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.inspection_rooms r
    JOIN public.inspection_reports ir ON ir.id = r.report_id
    JOIN public.jobs j ON j.id = ir.job_id
    WHERE r.id = inspection_items.room_id 
    AND j.client_id = auth.uid()
  )
);

-- Inspection Photos RLS
CREATE POLICY "Clerks can manage photos in their reports"
ON public.inspection_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.inspection_reports 
    WHERE inspection_reports.id = inspection_photos.report_id 
    AND inspection_reports.clerk_id = auth.uid()
  )
);

CREATE POLICY "Clients can view photos for their jobs"
ON public.inspection_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.inspection_reports ir
    JOIN public.jobs j ON j.id = ir.job_id
    WHERE ir.id = inspection_photos.report_id 
    AND j.client_id = auth.uid()
  )
);

-- Create storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-photos', 'inspection-photos', true);

-- Storage policies
CREATE POLICY "Clerks can upload inspection photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inspection-photos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view inspection photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspection-photos');

CREATE POLICY "Clerks can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'inspection-photos'
  AND auth.uid() IS NOT NULL
);

-- Update triggers
CREATE TRIGGER update_inspection_reports_updated_at
BEFORE UPDATE ON public.inspection_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_rooms_updated_at
BEFORE UPDATE ON public.inspection_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_items_updated_at
BEFORE UPDATE ON public.inspection_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();