-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "ctaText" TEXT NOT NULL DEFAULT 'Start free trial',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
