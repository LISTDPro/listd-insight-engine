-- Add description field to inspection_items for industry-standard item descriptions
ALTER TABLE public.inspection_items ADD COLUMN description text;