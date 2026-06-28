-- CreateEnum
CREATE TYPE "VisaType" AS ENUM ('skilled_worker', 'health_care_worker', 'student', 'graduate', 'family', 'settled_status', 'pre_settled_status', 'other');

-- CreateEnum
CREATE TYPE "RtwCheckType" AS ENUM ('manual', 'online_share_code', 'idsp');

-- CreateEnum
CREATE TYPE "RtwOutcome" AS ENUM ('passed', 'failed', 'follow_up');

-- CreateEnum
CREATE TYPE "LawfulBasis" AS ENUM ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests');

-- CreateEnum
CREATE TYPE "DsarType" AS ENUM ('access', 'erasure', 'rectification', 'portability', 'restriction', 'objection');

-- CreateEnum
CREATE TYPE "DsarStatus" AS ENUM ('received', 'in_progress', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "AccidentType" AS ENUM ('accident', 'near_miss', 'dangerous_occurrence');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('active', 'archived');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "sponsorLicenceExpiry" TIMESTAMP(3),
ADD COLUMN     "sponsorLicenceNo" TEXT,
ADD COLUMN     "sponsorLicenceRating" TEXT;

-- CreateTable
CREATE TABLE "visas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "VisaType" NOT NULL DEFAULT 'skilled_worker',
    "visaNumberEnc" TEXT,
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "cosRef" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rtw_checks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "checkType" "RtwCheckType" NOT NULL DEFAULT 'online_share_code',
    "documentType" TEXT,
    "outcome" "RtwOutcome" NOT NULL DEFAULT 'passed',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedById" TEXT,
    "followUpDate" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rtw_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "lawfulBasis" "LawfulBasis" NOT NULL DEFAULT 'consent',
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dsar_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectEmail" TEXT,
    "type" "DsarType" NOT NULL DEFAULT 'access',
    "status" "DsarStatus" NOT NULL DEFAULT 'received',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dsar_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equality_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "genderEnc" TEXT,
    "ethnicityEnc" TEXT,
    "disabilityEnc" TEXT,
    "religionEnc" TEXT,
    "sexualOrientationEnc" TEXT,
    "maritalStatusEnc" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equality_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "area" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "status" "RiskStatus" NOT NULL DEFAULT 'active',
    "lastReviewed" TIMESTAMP(3),
    "nextReview" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accidents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT,
    "type" "AccidentType" NOT NULL DEFAULT 'accident',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "riddorReportable" BOOLEAN NOT NULL DEFAULT false,
    "riddorRef" TEXT,
    "reportedToHse" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visas_tenantId_employeeId_idx" ON "visas"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "visas_expiryDate_idx" ON "visas"("expiryDate");

-- CreateIndex
CREATE INDEX "rtw_checks_tenantId_employeeId_idx" ON "rtw_checks"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "rtw_checks_followUpDate_idx" ON "rtw_checks"("followUpDate");

-- CreateIndex
CREATE INDEX "consent_records_tenantId_employeeId_idx" ON "consent_records"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "dsar_requests_tenantId_status_idx" ON "dsar_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "dsar_requests_dueAt_idx" ON "dsar_requests"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "equality_records_employeeId_key" ON "equality_records"("employeeId");

-- CreateIndex
CREATE INDEX "risk_assessments_tenantId_status_idx" ON "risk_assessments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "risk_assessments_nextReview_idx" ON "risk_assessments"("nextReview");

-- CreateIndex
CREATE INDEX "accidents_tenantId_type_idx" ON "accidents"("tenantId", "type");

-- CreateIndex
CREATE INDEX "accidents_occurredAt_idx" ON "accidents"("occurredAt");

-- AddForeignKey
ALTER TABLE "visas" ADD CONSTRAINT "visas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visas" ADD CONSTRAINT "visas_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtw_checks" ADD CONSTRAINT "rtw_checks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rtw_checks" ADD CONSTRAINT "rtw_checks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsar_requests" ADD CONSTRAINT "dsar_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equality_records" ADD CONSTRAINT "equality_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equality_records" ADD CONSTRAINT "equality_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accidents" ADD CONSTRAINT "accidents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accidents" ADD CONSTRAINT "accidents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
