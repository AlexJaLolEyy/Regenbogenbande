-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'owner';

-- AlterTable
ALTER TABLE "invites" ADD COLUMN     "image" TEXT;
