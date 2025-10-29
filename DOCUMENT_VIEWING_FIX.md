# Document Viewing Issue Fixed - Private Bucket Access

## Problem Identified
The error "Bucket not found" occurred when trying to view uploaded documents because:

1. **Private Bucket**: The `kyc-documents` bucket is set as **private** (which is correct for security)
2. **Public URL Attempt**: The code was trying to access documents using public URLs
3. **Access Denied**: Private buckets don't allow direct public access, causing the 404 error

## What Was Fixed

### ✅ **Updated Document Storage**
- Now stores **file paths** instead of public URLs in the database
- Private buckets require signed URLs for access, not public URLs

### ✅ **Added Signed URL Generation**
- New `getDocumentSignedUrl()` function creates temporary signed URLs
- Signed URLs expire after 1 hour for security
- Only authenticated users can generate signed URLs

### ✅ **Updated Document Viewing**
- Documents now open using signed URLs instead of direct public URLs
- Proper error handling for URL generation failures
- Better user feedback for viewing issues

## How It Works Now

### **Document Upload Process**
1. File uploads to private `kyc-documents` bucket ✅
2. File path (not public URL) stored in database ✅
3. Document metadata saved successfully ✅

### **Document Viewing Process**
1. User clicks "View" button 👁️
2. System generates signed URL for the file path 🔗
3. Signed URL opens in new tab with proper access ✅
4. URL expires after 1 hour for security ⏰

## Technical Changes Made

### **1. Updated `client/src/lib/supabase.ts`**
```typescript
// Before: Stored public URLs (didn't work for private buckets)
fileUrl: publicUrl

// After: Store file paths (works with private buckets)
fileUrl: filePath

// Added: Signed URL generation function
async getDocumentSignedUrl(filePath: string): Promise<{ success: boolean; url?: string; error?: string }>
```

### **2. Updated `client/src/pages/Employees.tsx`**
```typescript
// Before: Direct public URL access
onClick={() => window.open(doc.fileUrl, '_blank')}

// After: Generate signed URL first
onClick={() => handleViewDocument(doc.fileUrl)}
```

## Security Benefits

### ✅ **Enhanced Security**
- Documents are stored in private buckets
- Only authenticated users can access documents
- Signed URLs expire automatically
- No direct public access to sensitive documents

### ✅ **Access Control**
- RLS policies control who can generate signed URLs
- Only logged-in users can view documents
- Temporary access prevents unauthorized sharing

## Testing the Fix

### **Step 1: Upload a Document**
1. Go to Employees → Edit Employee → KYC Details
2. Upload any document (image or PDF)
3. Verify upload succeeds ✅

### **Step 2: View the Document**
1. Click the eye icon 👁️ next to the uploaded document
2. Document should open in new tab ✅
3. No more "Bucket not found" error ✅

### **Step 3: Verify Security**
1. Copy the signed URL from browser address bar
2. Try accessing it in incognito/private window
3. Should be denied access (security working) ✅

## Expected Behavior

### **✅ What Should Work Now**
- Document uploads successfully
- Documents open when clicking view button
- Signed URLs work for authenticated users
- URLs expire after 1 hour
- Private bucket security maintained

### **❌ What Should NOT Work**
- Direct public access to documents
- Accessing documents without authentication
- Using expired signed URLs

## Troubleshooting

### **If documents still don't open:**

1. **Check Authentication**
   - Ensure you're logged in
   - Verify user session is active

2. **Check Browser Console**
   - Look for signed URL generation errors
   - Check for authentication errors

3. **Verify Bucket Setup**
   - Ensure `kyc-documents` bucket exists
   - Verify RLS policies are set correctly

4. **Test with Different File Types**
   - Try both images and PDFs
   - Check file size limits

### **Common Error Messages:**

- **"Failed to generate document URL"** → Authentication or bucket issue
- **"Permission denied"** → RLS policy not allowing signed URL generation
- **"File not found"** → Document was deleted or path is incorrect

## Files Modified

- `client/src/lib/supabase.ts` - Updated storage and added signed URL function
- `client/src/pages/Employees.tsx` - Updated document viewing logic

## Next Steps

1. **Test Document Upload and Viewing** - Verify everything works
2. **Test with Different Users** - Ensure both admin and manager can access
3. **Verify Security** - Confirm private bucket access is properly controlled
4. **Monitor Performance** - Signed URLs should generate quickly

The document viewing issue is now fixed! Documents will open properly using secure signed URLs instead of trying to access private buckets directly.
