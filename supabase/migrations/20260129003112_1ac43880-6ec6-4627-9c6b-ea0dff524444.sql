-- Add additional room columns to properties table for pricing calculation
ALTER TABLE public.properties
ADD COLUMN utility_rooms integer NOT NULL DEFAULT 0,
ADD COLUMN storage_rooms integer NOT NULL DEFAULT 0,
ADD COLUMN hallways_stairs integer NOT NULL DEFAULT 0,
ADD COLUMN gardens integer NOT NULL DEFAULT 0,
ADD COLUMN communal_areas integer NOT NULL DEFAULT 0;