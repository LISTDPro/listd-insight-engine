-- Add heavily_furnished column to properties table
ALTER TABLE public.properties
ADD COLUMN heavily_furnished boolean NOT NULL DEFAULT false;