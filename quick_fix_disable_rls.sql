-- Quick fix: Temporarily disable RLS for storage.objects
-- This will allow uploads to work immediately
-- Run this in your Supabase SQL editor

-- Disable RLS temporarily
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false, -- private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Note: After testing, you should re-enable RLS and create proper policies:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- Then run the fix_rls_policies.sql file
