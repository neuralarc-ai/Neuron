-- Migration: Add KYC functionality to employees
-- Date: 2025

-- Add KYC fields to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "aadhaarNumber" VARCHAR(12);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "panNumber" VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "phoneNumber" VARCHAR(15);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP;

-- Bank details
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "bankAccountNumber" VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "ifscCode" VARCHAR(11);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "bankBranch" VARCHAR(255);

-- Emergency contact
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "emergencyContactName" VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "emergencyContactPhone" VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "emergencyContactRelation" VARCHAR(50);

-- Nominee details
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "nomineeName" VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "nomineeRelation" VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "nomineeAadhaar" VARCHAR(12);

-- Profile photo
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;

-- KYC status
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "kycStatus" VARCHAR(20) DEFAULT 'pending';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "kycVerifiedAt" TIMESTAMP;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "kycVerifiedBy" INTEGER REFERENCES employees(id);

-- Create KYC documents table
CREATE TABLE IF NOT EXISTS "employeeKycDocuments" (
  "id" SERIAL PRIMARY KEY,
  "employeeId" INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  "documentType" VARCHAR(50) NOT NULL,
  "documentName" VARCHAR(255) NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" VARCHAR(100),
  "uploadDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "verified" BOOLEAN DEFAULT FALSE,
  "verifiedBy" INTEGER REFERENCES employees(id),
  "verifiedAt" TIMESTAMP,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_kyc_employee" ON "employeeKycDocuments"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_kyc_type" ON "employeeKycDocuments"("documentType");

-- Create trigger for updatedAt
CREATE OR REPLACE FUNCTION update_kyc_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kyc_documents_timestamp
BEFORE UPDATE ON "employeeKycDocuments"
FOR EACH ROW
EXECUTE FUNCTION update_kyc_documents_updated_at();

-- Add comments
COMMENT ON TABLE "employeeKycDocuments" IS 'Stores KYC documents uploaded by employees';
COMMENT ON COLUMN "employeeKycDocuments"."documentType" IS 'Type of document: aadhaar, pan, passport, address_proof, bank_statement, education_certificate, experience_certificate, profile_photo, other';
COMMENT ON COLUMN employees."kycStatus" IS 'KYC status: pending, verified, rejected';

