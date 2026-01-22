/*
  Warnings:

  - You are about to drop the column `placeholderId` on the `picture_participants` table. All the data in the column will be lost.
  - You are about to drop the column `placeholderId` on the `quote_participants` table. All the data in the column will be lost.
  - You are about to drop the column `placeholderId` on the `video_participants` table. All the data in the column will be lost.
  - You are about to drop the `participant_placeholders` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `userId` on table `picture_participants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `quote_participants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `video_participants` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "participant_placeholders" DROP CONSTRAINT "participant_placeholders_claimedById_fkey";

-- DropForeignKey
ALTER TABLE "picture_participants" DROP CONSTRAINT "picture_participants_placeholderId_fkey";

-- DropForeignKey
ALTER TABLE "quote_participants" DROP CONSTRAINT "quote_participants_placeholderId_fkey";

-- DropForeignKey
ALTER TABLE "video_participants" DROP CONSTRAINT "video_participants_placeholderId_fkey";

-- DropIndex
DROP INDEX "picture_participants_pictureId_placeholderId_key";

-- DropIndex
DROP INDEX "picture_participants_placeholderId_idx";

-- DropIndex
DROP INDEX "quote_participants_placeholderId_idx";

-- DropIndex
DROP INDEX "quote_participants_quoteId_placeholderId_key";

-- DropIndex
DROP INDEX "video_participants_placeholderId_idx";

-- DropIndex
DROP INDEX "video_participants_videoId_placeholderId_key";

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "picture_participants" DROP COLUMN "placeholderId",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "quote_participants" DROP COLUMN "placeholderId",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "video_participants" DROP COLUMN "placeholderId",
ALTER COLUMN "userId" SET NOT NULL;

-- DropTable
DROP TABLE "participant_placeholders";

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
