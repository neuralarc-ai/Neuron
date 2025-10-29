-- Fix RLS policies for KYC document uploads
-- This script addresses the "new row violates row-level security policy" error

-- First, let's check if the bucket exists and create it if it doesn't
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false, -- private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;

-- Create more permissive policies for authenticated users
-- Policy 1: Allow authenticated users to upload to kyc-documents bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Allow authenticated users to view files in kyc-documents bucket
CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated users to delete files in kyc-documents bucket
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to update files in kyc-documents bucket
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

-- Alternative: If the above doesn't work, try these more permissive policies
-- Uncomment these if the above policies still don't work:

-- CREATE POLICY "Allow all authenticated operations" ON storage.objects
-- FOR ALL USING (
--   bucket_id = 'kyc-documents' AND
--   auth.role() = 'authenticated'
-- );

-- If you're still having issues, you can temporarily disable RLS for testing:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- (Remember to re-enable it later: ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;)
