-- Create storage bucket for pre-pray sample files
INSERT INTO storage.buckets (id, name, public)
VALUES ('pre-pray-samples', 'pre-pray-samples', true);

-- Create RLS policies for the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'pre-pray-samples');

CREATE POLICY "Admin can upload to pre-pray-samples"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pre-pray-samples' 
  AND auth.role() = 'authenticated'
);