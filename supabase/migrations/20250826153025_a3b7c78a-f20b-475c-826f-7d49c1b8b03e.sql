-- Create workshop_files storage bucket for PDF worksheets
INSERT INTO storage.buckets (id, name, public) VALUES ('workshop_files', 'workshop_files', false);

-- Create RLS policies for workshop_files bucket
CREATE POLICY "Admin can manage workshop files" ON storage.objects
FOR ALL USING (
  bucket_id = 'workshop_files' AND 
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = (auth.jwt() ->> 'email') 
    AND admins.email = 'ruthprissman@gmail.com'
  )
);

CREATE POLICY "Service role can access workshop files" ON storage.objects
FOR ALL USING (bucket_id = 'workshop_files' AND auth.role() = 'service_role');

-- Add worksheet columns to workshops table
ALTER TABLE workshops 
ADD COLUMN worksheet_file_path TEXT,
ADD COLUMN worksheet_file_name TEXT,
ADD COLUMN worksheet_file_size INTEGER,
ADD COLUMN attach_worksheet_to_invitation BOOLEAN DEFAULT false;