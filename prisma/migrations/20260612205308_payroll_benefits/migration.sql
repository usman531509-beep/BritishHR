-- CreateEnum
CREATE TYPE "PayRunStatus" AS ENUM ('draft', 'finalised');

-- CreateEnum
CREATE TYPE "PayFrequency" AS ENUM ('monthly', 'weekly', 'fortnightly');

-- CreateEnum
CREATE TYPE "PensionEnrolmentStatus" AS ENUM ('enrolled', 'opted_out', 'postponed', 'not_eligible');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('mileage', 'travel', 'subsistence', 'equipment', 'training', 'other');

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('company_car', 'private_medical', 'fuel', 'loan', 'accommodation', 'other');

-- CreateTable
CREATE TABLE "pay_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL,
    "frequency" "PayFrequency" NOT NULL DEFAULT 'monthly',
    "status" "PayRunStatus" NOT NULL DEFAULT 'draft',
    "taxYear" TEXT NOT NULL DEFAULT '2024/25',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pay_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "payRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "grossPence" INTEGER NOT NULL,
    "incomeTaxPence" INTEGER NOT NULL,
    "employeeNiPence" INTEGER NOT NULL,
    "employerNiPence" INTEGER NOT NULL,
    "pensionEmployeePence" INTEGER NOT NULL DEFAULT 0,
    "pensionEmployerPence" INTEGER NOT NULL DEFAULT 0,
    "studentLoanPence" INTEGER NOT NULL DEFAULT 0,
    "netPence" INTEGER NOT NULL,
    "taxYear" TEXT NOT NULL,
    "breakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pension_schemes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "employeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "employerRate" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pension_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pension_enrolments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "schemeId" TEXT,
    "status" "PensionEnrolmentStatus" NOT NULL DEFAULT 'enrolled',
    "category" TEXT,
    "enrolledAt" TIMESTAMP(3),
    "optedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pension_enrolments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_claims" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'other',
    "amountPence" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "incurredOn" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'pending',
    "approverId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefits_in_kind" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "BenefitType" NOT NULL DEFAULT 'other',
    "description" TEXT,
    "cashEquivalentPence" INTEGER NOT NULL,
    "taxYear" TEXT NOT NULL DEFAULT '2024/25',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefits_in_kind_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pay_runs_tenantId_status_idx" ON "pay_runs"("tenantId", "status");

-- CreateIndex
CREATE INDEX "payslips_tenantId_employeeId_idx" ON "payslips"("tenantId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payRunId_employeeId_key" ON "payslips"("payRunId", "employeeId");

-- CreateIndex
CREATE INDEX "pension_schemes_tenantId_idx" ON "pension_schemes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "pension_enrolments_employeeId_key" ON "pension_enrolments"("employeeId");

-- CreateIndex
CREATE INDEX "pension_enrolments_tenantId_status_idx" ON "pension_enrolments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "expense_claims_tenantId_status_idx" ON "expense_claims"("tenantId", "status");

-- CreateIndex
CREATE INDEX "expense_claims_tenantId_employeeId_idx" ON "expense_claims"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "benefits_in_kind_tenantId_employeeId_idx" ON "benefits_in_kind"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "benefits_in_kind_tenantId_taxYear_idx" ON "benefits_in_kind"("tenantId", "taxYear");

-- AddForeignKey
ALTER TABLE "pay_runs" ADD CONSTRAINT "pay_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payRunId_fkey" FOREIGN KEY ("payRunId") REFERENCES "pay_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pension_schemes" ADD CONSTRAINT "pension_schemes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pension_enrolments" ADD CONSTRAINT "pension_enrolments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pension_enrolments" ADD CONSTRAINT "pension_enrolments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pension_enrolments" ADD CONSTRAINT "pension_enrolments_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "pension_schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefits_in_kind" ADD CONSTRAINT "benefits_in_kind_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefits_in_kind" ADD CONSTRAINT "benefits_in_kind_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
