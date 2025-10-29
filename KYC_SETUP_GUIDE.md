# KYC Document Upload Setup Guide

## Issue Fixed
The document upload was failing because the Supabase storage bucket `kyc-documents` was not created. This guide will help you set up the storage bucket properly.

## Steps to Fix Document Upload

### 1. Run Database Migration
First, apply the KYC database migration:
```sql
-- Run the database_migration_add_kyc.sql file in your Supabase SQL editor
```

### 2. Create Storage Bucket
Run the following SQL in your Supabase SQL editor to create the storage bucket:

```sql
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
```

### 3. Alternative: Manual Setup via Supabase Dashboard

If you prefer using the dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create bucket**
4. Set the following:
   - **Name**: `kyc-documents`
   - **Public**: No (unchecked)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp,application/pdf`

5. After creating the bucket, go to **Storage** → **Policies**
6. Create the following policies for the `kyc-documents` bucket:

   **Policy 1: Allow authenticated uploads**
   ```sql
   CREATE POLICY "Allow authenticated uploads" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'kyc-documents' AND
     auth.role() = 'authenticated'
   );
   ```

   **Policy 2: Allow authenticated downloads**
   ```sql
   CREATE POLICY "Allow authenticated downloads" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'kyc-documents' AND
     auth.role() = 'authenticated'
   );
   ```

   **Policy 3: Allow authenticated deletes**
   ```sql
   CREATE POLICY "Allow authenticated deletes" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'kyc-documents' AND
     auth.role() = 'authenticated'
   );
   ```

   **Policy 4: Allow authenticated updates**
   ```sql
   CREATE POLICY "Allow authenticated updates" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'kyc-documents' AND
     auth.role() = 'authenticated'
   );
   ```

## What Was Fixed

### 1. Enhanced Error Handling
- Added specific error messages for different failure scenarios
- Added file type validation (only images and PDFs allowed)
- Added file size validation (5MB limit)
- Added detailed console logging for debugging

### 2. Better Error Messages
The upload function now provides specific error messages:
- "Storage bucket not configured" - when bucket doesn't exist
- "Invalid file type" - when file type is not allowed
- "File size exceeds limit" - when file is too large
- Specific Supabase error messages for other issues

### 3. Improved Validation
- Client-side validation before upload
- Server-side validation in the API function
- Automatic cleanup if database save fails

## Testing the Fix

1. After setting up the storage bucket, try uploading a document
2. Check the browser console for detailed logs
3. The upload should now work successfully

## File Structure
Documents are stored with the following structure:
```
kyc-documents/
  └── {employeeId}/
      ├── aadhaar_1234567890.jpg
      ├── pan_1234567890.pdf
      └── passport_1234567890.png
```

## Security Features
- Private bucket (not publicly accessible)
- Authenticated users only
- File type restrictions
- File size limits
- Automatic cleanup on failed database saves

## Troubleshooting

If uploads still fail:
1. Check browser console for error messages
2. Verify the bucket exists in Supabase Storage
3. Check that RLS policies are properly set
4. Ensure your Supabase project has the correct environment variables

The enhanced error handling will now provide specific error messages to help identify the exact issue.
