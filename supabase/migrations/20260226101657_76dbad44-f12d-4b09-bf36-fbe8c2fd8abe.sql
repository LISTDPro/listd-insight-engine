ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspection_types text[] DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_by uuid;