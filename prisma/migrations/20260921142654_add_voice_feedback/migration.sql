-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "voiceData" TEXT,
ADD COLUMN     "voiceDuration" INTEGER,
ADD COLUMN     "voiceMimeType" TEXT,
ADD COLUMN     "voiceUpdatedAt" TIMESTAMP(3);
