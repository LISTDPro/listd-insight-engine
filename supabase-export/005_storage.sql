-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-photos', 'inspection-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('condition-photos', 'condition-photos', false);

-- Add appropriate storage policies for your buckets
-- Example:
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inspection-photos');
-- CREATE POLICY "Users can view their uploads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'inspection-photos');
