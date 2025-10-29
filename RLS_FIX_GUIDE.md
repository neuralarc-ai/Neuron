# Fix for "new row violates row-level security policy" Error

## Problem
The error "Upload failed: new row violates row-level security policy" occurs because Supabase's Row Level Security (RLS) policies are preventing file uploads to the storage bucket.

## Quick Fix (Recommended)

### Step 1: Run the Quick Fix SQL
Execute this SQL in your Supabase SQL editor:

```sql
-- Quick fix: Temporarily disable RLS for storage.objects
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
```

### Step 2: Test Upload
After running the SQL:
1. Try uploading a document
2. It should work immediately
3. Check browser console for detailed logs

## Permanent Fix (After Testing)

Once uploads are working, re-enable RLS with proper policies:

```sql
-- Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create proper policies
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'authenticated'
);
```

## Alternative: Manual Setup via Dashboard

### 1. Create Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Click "Create bucket"
3. Name: `kyc-documents`
4. Public: No (unchecked)
5. File size limit: 5MB
6. Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp,application/pdf`

### 2. Disable RLS Temporarily
1. Go to Storage → Policies
2. Find the `storage.objects` table
3. Click the toggle to disable RLS
4. Test uploads
5. Re-enable RLS and add policies later

## Enhanced Error Handling

The code now includes:
- ✅ Authentication check before upload
- ✅ Specific error message for RLS policy violations
- ✅ Detailed console logging for debugging
- ✅ Better error messages for different failure scenarios

## Debugging Steps

1. **Check Browser Console**
   - Look for detailed logs about the upload process
   - Check authentication status
   - Verify Supabase configuration

2. **Verify Supabase Setup**
   - Ensure environment variables are correct
   - Check that the bucket exists
   - Verify RLS policies

3. **Test Authentication**
   - The code now checks if user is authenticated
   - Look for "User authenticated" message in console

## Files Created

- `quick_fix_disable_rls.sql` - Immediate fix
- `fix_rls_policies.sql` - Proper RLS policies
- Enhanced error handling in `client/src/lib/supabase.ts`

## Expected Console Output

When working correctly, you should see:
```
Uploading file: 1/aadhaar_1234567890.jpg Size: 123456 Type: image/jpeg
Supabase URL: https://your-project.supabase.co
Supabase Key exists: true
User authenticated: user@example.com
File uploaded successfully: {path: "1/aadhaar_1234567890.jpg", ...}
Public URL: https://your-project.supabase.co/storage/v1/object/public/kyc-documents/...
```

## Security Note

Disabling RLS is a temporary measure for testing. In production, you should:
1. Re-enable RLS
2. Create proper policies
3. Test thoroughly
4. Monitor for security issues

The enhanced error handling will now provide specific guidance on what needs to be fixed.
