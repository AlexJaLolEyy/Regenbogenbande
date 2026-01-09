-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "quoteId" TEXT;

-- CreateIndex
CREATE INDEX "comments_quoteId_idx" ON "comments"("quoteId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
