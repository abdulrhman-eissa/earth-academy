/*
  Warnings:

  - A unique constraint covering the columns `[chosenAssignmentId]` on the table `StudentProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "chosenAssignmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_chosenAssignmentId_key" ON "StudentProfile"("chosenAssignmentId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_chosenAssignmentId_fkey" FOREIGN KEY ("chosenAssignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
