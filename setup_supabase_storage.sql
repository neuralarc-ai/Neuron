-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false, -- private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
);

-- Create RLS policies for the bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);
