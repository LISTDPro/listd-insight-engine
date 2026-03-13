
-- Create condition enum
CREATE TYPE public.item_condition AS ENUM ('good', 'fair', 'poor', 'na');

-- inspection_rooms_map
CREATE TABLE public.inspection_rooms_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_rooms_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clerks can manage rooms for their jobs" ON public.inspection_rooms_map
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = inspection_rooms_map.job_id AND jobs.clerk_id = auth.uid()));

CREATE POLICY "Admins can manage all mapped rooms" ON public.inspection_rooms_map
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view rooms for their jobs" ON public.inspection_rooms_map
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = inspection_rooms_map.job_id AND jobs.client_id = auth.uid()));

-- inspection_items_map
CREATE TABLE public.inspection_items_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.inspection_rooms_map(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  condition public.item_condition DEFAULT 'na',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_items_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clerks can manage items for their jobs" ON public.inspection_items_map
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = inspection_items_map.job_id AND jobs.clerk_id = auth.uid()));

CREATE POLICY "Admins can manage all mapped items" ON public.inspection_items_map
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view items for their jobs" ON public.inspection_items_map
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = inspection_items_map.job_id AND jobs.client_id = auth.uid()));

-- inspection_item_photos
CREATE TABLE public.inspection_item_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inspection_items_map(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_item_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clerks can manage photos for their jobs" ON public.inspection_item_photos
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = inspection_item_photos.job_id AND jobs.clerk_id = auth.uid()));

CREATE POLICY "Admins can manage all item photos" ON public.inspection_item_photos
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view photos for their jobs" ON public.inspection_item_photos
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = inspection_item_photos.job_id AND jobs.client_id = auth.uid()));

-- Storage bucket for condition photos
INSERT INTO storage.buckets (id, name, public) VALUES ('condition-photos', 'condition-photos', false);

-- Storage RLS policies
CREATE POLICY "Clerks can upload condition photos" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'condition-photos' AND (storage.foldername(name))[1] IN (
    SELECT j.id::text FROM public.jobs j WHERE j.clerk_id = auth.uid()
  ));

CREATE POLICY "Clerks can view condition photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'condition-photos' AND (storage.foldername(name))[1] IN (
    SELECT j.id::text FROM public.jobs j WHERE j.clerk_id = auth.uid()
  ));

CREATE POLICY "Clients can view condition photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'condition-photos' AND (storage.foldername(name))[1] IN (
    SELECT j.id::text FROM public.jobs j WHERE j.client_id = auth.uid()
  ));

CREATE POLICY "Admins can manage condition photos" ON storage.objects
  FOR ALL TO public
  USING (bucket_id = 'condition-photos' AND public.has_role(auth.uid(), 'admin'));
