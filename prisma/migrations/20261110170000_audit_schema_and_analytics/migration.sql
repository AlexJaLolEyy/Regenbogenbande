-- Audit migration: Phase 1 schema fixes + Phase 3 analytics tables.
-- Written to be safe on existing data (additive; constraints are preceded by cleanup).

-- ============================================
-- Enum
-- ============================================
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'PICTURE', 'QUOTE');

-- ============================================
-- Invite: image column already exists in prod (migration 20260212091615_add_owner_role).
-- IF NOT EXISTS keeps this idempotent so the model and the database agree.
-- ============================================
ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Clear dangling creator references before adding the foreign key
UPDATE "invites" SET "createdById" = NULL
WHERE "createdById" IS NOT NULL
  AND "createdById" NOT IN (SELECT "id" FROM "users");

CREATE INDEX "invites_createdById_idx" ON "invites"("createdById");
ALTER TABLE "invites"
  ADD CONSTRAINT "invites_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- Denormalized rating aggregates (+ backfill)
-- ============================================
ALTER TABLE "videos"   ADD COLUMN "ratingAvg" DOUBLE PRECISION, ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pictures" ADD COLUMN "ratingAvg" DOUBLE PRECISION, ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "quotes"   ADD COLUMN "ratingAvg" DOUBLE PRECISION, ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "videos" v SET "ratingAvg" = r.avg, "ratingCount" = r.cnt
FROM (SELECT "videoId" AS id, AVG("value") AS avg, COUNT(*)::int AS cnt FROM "ratings" WHERE "videoId" IS NOT NULL GROUP BY "videoId") r
WHERE v."id" = r.id;

UPDATE "pictures" p SET "ratingAvg" = r.avg, "ratingCount" = r.cnt
FROM (SELECT "pictureId" AS id, AVG("value") AS avg, COUNT(*)::int AS cnt FROM "ratings" WHERE "pictureId" IS NOT NULL GROUP BY "pictureId") r
WHERE p."id" = r.id;

UPDATE "quotes" q SET "ratingAvg" = r.avg, "ratingCount" = r.cnt
FROM (SELECT "quoteId" AS id, AVG("value") AS avg, COUNT(*)::int AS cnt FROM "ratings" WHERE "quoteId" IS NOT NULL GROUP BY "quoteId") r
WHERE q."id" = r.id;

-- ============================================
-- Composite / supporting indexes
-- ============================================
CREATE INDEX "videos_isPublic_createdAt_idx"       ON "videos"("isPublic", "createdAt");
CREATE INDEX "videos_views_idx"                    ON "videos"("views");
CREATE INDEX "videos_publishedAt_idx"              ON "videos"("publishedAt");
CREATE INDEX "videos_categoryId_createdAt_idx"     ON "videos"("categoryId", "createdAt");

CREATE INDEX "pictures_isPublic_createdAt_idx"     ON "pictures"("isPublic", "createdAt");
CREATE INDEX "pictures_views_idx"                  ON "pictures"("views");
CREATE INDEX "pictures_publishedAt_idx"            ON "pictures"("publishedAt");
CREATE INDEX "pictures_categoryId_createdAt_idx"   ON "pictures"("categoryId", "createdAt");

CREATE INDEX "quotes_isPublic_createdAt_idx"       ON "quotes"("isPublic", "createdAt");
CREATE INDEX "quotes_views_idx"                    ON "quotes"("views");
CREATE INDEX "quotes_publishedAt_idx"              ON "quotes"("publishedAt");

CREATE INDEX "ratings_userId_createdAt_idx"        ON "ratings"("userId", "createdAt");
CREATE INDEX "comments_userId_createdAt_idx"       ON "comments"("userId", "createdAt");

-- ============================================
-- View tables: keep first view in viewedAt, add lastViewedAt
-- ============================================
ALTER TABLE "user_video_views"   ADD COLUMN "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user_picture_views" ADD COLUMN "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing rows only know the last view time (it was overwritten on every re-view)
UPDATE "user_video_views"   SET "lastViewedAt" = "viewedAt";
UPDATE "user_picture_views" SET "lastViewedAt" = "viewedAt";

-- ============================================
-- user_quote_views (parity with video/picture)
-- ============================================
CREATE TABLE "user_quote_views" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quote_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_quote_views_userId_quoteId_key" ON "user_quote_views"("userId", "quoteId");
CREATE INDEX "user_quote_views_userId_idx"  ON "user_quote_views"("userId");
CREATE INDEX "user_quote_views_quoteId_idx" ON "user_quote_views"("quoteId");

ALTER TABLE "user_quote_views"
  ADD CONSTRAINT "user_quote_views_userId_fkey"  FOREIGN KEY ("userId")  REFERENCES "users"("id")  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_quote_views_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- content_views (analytics event log)
-- ============================================
CREATE TABLE "content_views" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "userId" TEXT,
    "viewerHash" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "content_views_contentType_viewedAt_idx" ON "content_views"("contentType", "viewedAt");
CREATE INDEX "content_views_contentId_viewedAt_idx"   ON "content_views"("contentId", "viewedAt");
CREATE INDEX "content_views_ownerId_viewedAt_idx"     ON "content_views"("ownerId", "viewedAt");
CREATE INDEX "content_views_userId_viewedAt_idx"      ON "content_views"("userId", "viewedAt");

-- ============================================
-- Integrity CHECK constraints (not expressible in Prisma)
-- Added NOT VALID first so legacy rows can't block the migration, then validated
-- separately: if VALIDATE fails, fix the offending rows and run it again.
-- ============================================
ALTER TABLE "ratings"
  ADD CONSTRAINT "ratings_exactly_one_target"
  CHECK (num_nonnulls("videoId", "pictureId", "quoteId") = 1) NOT VALID;
ALTER TABLE "ratings"
  ADD CONSTRAINT "ratings_value_range"
  CHECK ("value" BETWEEN 1 AND 5) NOT VALID;

ALTER TABLE "comments"
  ADD CONSTRAINT "comments_exactly_one_target"
  CHECK (num_nonnulls("videoId", "pictureId", "quoteId") = 1) NOT VALID;

ALTER TABLE "comment_votes"
  ADD CONSTRAINT "comment_votes_value_check"
  CHECK ("value" IN (-1, 1)) NOT VALID;

ALTER TABLE "ratings"       VALIDATE CONSTRAINT "ratings_exactly_one_target";
ALTER TABLE "ratings"       VALIDATE CONSTRAINT "ratings_value_range";
ALTER TABLE "comments"      VALIDATE CONSTRAINT "comments_exactly_one_target";
ALTER TABLE "comment_votes" VALIDATE CONSTRAINT "comment_votes_value_check";
