-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "browser" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "isp" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "referer" TEXT,
ADD COLUMN     "region" TEXT;
