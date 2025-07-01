
-- Add attachment_urls column to sessions table to store up to 5 file URLs
ALTER TABLE public.sessions 
ADD COLUMN attachment_urls TEXT[] DEFAULT '{}';

-- Create storage bucket for session attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('session-attachments', 'session-attachments', true);

-- Create RLS policy for session attachments bucket
CREATE POLICY "Users can view session attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'session-attachments');

CREATE POLICY "Users can upload session attachments" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'session-attachments');

CREATE POLICY "Users can update session attachments" ON storage.objects
FOR UPDATE USING (bucket_id = 'session-attachments');

CREATE POLICY "Users can delete session attachments" ON storage.objects
FOR DELETE USING (bucket_id = 'session-attachments');
