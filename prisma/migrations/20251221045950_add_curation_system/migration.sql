/*
  Warnings:

  - The values [guest] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `verifications` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[pictureId,placeholderId]` on the table `picture_participants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[quoteId,placeholderId]` on the table `quote_participants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[videoId,placeholderId]` on the table `video_participants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('admin', 'member');
ALTER TABLE "public"."invites" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "invites" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "invites" ALTER COLUMN "role" SET DEFAULT 'member';
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';
COMMIT;

-- AlterTable
ALTER TABLE "picture_participants" ADD COLUMN     "placeholderId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pictures" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quote_participants" ADD COLUMN     "placeholderId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "role" SET DEFAULT 'member';

-- AlterTable
ALTER TABLE "video_participants" ADD COLUMN     "placeholderId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "verifications";

-- CreateTable
CREATE TABLE "participant_placeholders" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "discordId" TEXT,
    "claimedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_placeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "participant_placeholders_claimedById_idx" ON "participant_placeholders"("claimedById");

-- CreateIndex
CREATE INDEX "participant_placeholders_discordId_idx" ON "participant_placeholders"("discordId");

-- CreateIndex
CREATE INDEX "picture_participants_placeholderId_idx" ON "picture_participants"("placeholderId");

-- CreateIndex
CREATE UNIQUE INDEX "picture_participants_pictureId_placeholderId_key" ON "picture_participants"("pictureId", "placeholderId");

-- CreateIndex
CREATE INDEX "pictures_isPublic_idx" ON "pictures"("isPublic");

-- CreateIndex
CREATE INDEX "quote_participants_placeholderId_idx" ON "quote_participants"("placeholderId");

-- CreateIndex
CREATE UNIQUE INDEX "quote_participants_quoteId_placeholderId_key" ON "quote_participants"("quoteId", "placeholderId");

-- CreateIndex
CREATE INDEX "quotes_isPublic_idx" ON "quotes"("isPublic");

-- CreateIndex
CREATE INDEX "video_participants_placeholderId_idx" ON "video_participants"("placeholderId");

-- CreateIndex
CREATE UNIQUE INDEX "video_participants_videoId_placeholderId_key" ON "video_participants"("videoId", "placeholderId");

-- CreateIndex
CREATE INDEX "videos_isPublic_idx" ON "videos"("isPublic");

-- AddForeignKey
ALTER TABLE "participant_placeholders" ADD CONSTRAINT "participant_placeholders_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_participants" ADD CONSTRAINT "video_participants_placeholderId_fkey" FOREIGN KEY ("placeholderId") REFERENCES "participant_placeholders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picture_participants" ADD CONSTRAINT "picture_participants_placeholderId_fkey" FOREIGN KEY ("placeholderId") REFERENCES "participant_placeholders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_participants" ADD CONSTRAINT "quote_participants_placeholderId_fkey" FOREIGN KEY ("placeholderId") REFERENCES "participant_placeholders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
