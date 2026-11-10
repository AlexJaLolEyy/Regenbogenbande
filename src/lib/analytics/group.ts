import { Prisma } from "@/src/generated/prisma"
import { prisma } from "@/src/lib/prisma"
import { unstable_cache } from "next/cache"
import { bucketSql, fillSeries, parseRangeKey, resolveRange, type RangeKey, type SeriesPoint } from "./range"

export interface PersonStat {
  userId: string
  name: string
  image: string | null
  value: number
}

export interface ContentStat {
  type: "video" | "picture" | "quote"
  id: string
  title: string
  views: number
  ratingAvg: number | null
  ratingCount: number
  commentCount: number
}

export interface GroupAnalytics {
  totals: {
    video: number
    picture: number
    quote: number
    publicCount: number
    privateCount: number
    members: { active: number; invited: number; disabled: number }
    views: number
    comments: number
    ratings: number
  }
  uploadsSeries: SeriesPoint[]
  viewsSeries: SeriesPoint[]
  leaderboards: {
    topUploaders: PersonStat[]
    mostViewedUploaders: PersonStat[]
    mostTagged: PersonStat[]
    mostQuoted: PersonStat[]
    topCommenters: PersonStat[]
    generousRaters: PersonStat[]
    strictRaters: PersonStat[]
  }
  topContent: {
    mostViewed: ContentStat[]
    topRated: ContentStat[]
    mostCommented: ContentStat[]
    hiddenGems: ContentStat[]
  }
  categories: { id: string; name: string; count: number; avgRating: number | null }[]
  topPairs: { nameA: string; nameB: string; count: number }[]
  activeMembers: { last7: number; last30: number }
  onThisDay: { type: "video" | "picture" | "quote"; id: string; title: string; year: number }[]
  /** Admin only */
  admin: null | {
    invites: { pending: number; used: number }
    publishBacklog: { video: number; picture: number; quote: number }
  }
}

const n = (v: unknown) => Number(v ?? 0)

const CONTENT = Prisma.sql`(
  SELECT 'video'::text AS type, id, title, views, "ratingAvg", "ratingCount", "uploadedById", "uploadedAt", "createdAt", "isPublic" FROM videos
  UNION ALL
  SELECT 'picture'::text, id, title, views, "ratingAvg", "ratingCount", "uploadedById", "uploadedAt", "createdAt", "isPublic" FROM pictures
  UNION ALL
  SELECT 'quote'::text, q.id,
    COALESCE((SELECT left(m.message, 60) FROM quote_messages m WHERE m."quoteId" = q.id AND m."isContext" = false ORDER BY m."createdAt" LIMIT 1), 'Quote'),
    q.views, q."ratingAvg", q."ratingCount", q."uploadedById", q."uploadedAt", q."createdAt", q."isPublic" FROM quotes q
) c`

const CONTENT_WITH_COMMENTS = Prisma.sql`(
  SELECT c.*, (SELECT COUNT(*)::int FROM comments cm WHERE
    (c.type = 'video' AND cm."videoId" = c.id) OR (c.type = 'picture' AND cm."pictureId" = c.id) OR (c.type = 'quote' AND cm."quoteId" = c.id)
  ) AS "commentCount" FROM ${CONTENT}
) cc`

async function computeGroupAnalytics(rangeKey: RangeKey, includeAdmin: boolean): Promise<GroupAnalytics> {
  const range = resolveRange(rangeKey)
  const from = range.from
  const bucket = bucketSql(range.bucket)
  const people = (rows: { userId: string; name: string; image: string | null; value: number }[]): PersonStat[] =>
    rows.map((r) => ({ ...r, value: Number(r.value) }))
  const content = (rows: ContentStat[]): ContentStat[] =>
    rows.map((r) => ({
      ...r,
      views: n(r.views),
      ratingCount: n(r.ratingCount),
      commentCount: n(r.commentCount),
      ratingAvg: r.ratingAvg == null ? null : Number(r.ratingAvg),
    }))

  const [
    typeCounts,
    visibility,
    memberStatus,
    viewsTotal,
    commentsTotal,
    ratingsTotal,
    uploadsRows,
    viewsRows,
    topUploaders,
    mostViewedUploaders,
    mostTagged,
    mostQuoted,
    topCommenters,
    generousRaters,
    strictRaters,
    mostViewed,
    topRated,
    mostCommented,
    hiddenGems,
    categories,
    pairs,
    active,
    onThisDay,
  ] = await Promise.all([
    Promise.all([prisma.video.count(), prisma.picture.count(), prisma.quote.count()]),
    prisma.$queryRaw<{ pub: number; priv: number }[]>`
      SELECT COUNT(*) FILTER (WHERE "isPublic")::int AS pub, COUNT(*) FILTER (WHERE NOT "isPublic")::int AS priv FROM ${CONTENT}`,
    prisma.user.groupBy({ by: ["status"], where: { isAnonymous: false }, _count: { _all: true } }),
    prisma.$queryRaw<{ total: number }[]>`
      SELECT (COALESCE((SELECT SUM(views) FROM videos), 0) + COALESCE((SELECT SUM(views) FROM pictures), 0) + COALESCE((SELECT SUM(views) FROM quotes), 0))::int AS total`,
    prisma.comment.count(),
    prisma.rating.count(),
    prisma.$queryRaw<{ date: string; video: number; picture: number; quote: number }[]>`
      SELECT to_char(date_trunc(${bucket}, "uploadedAt"), 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE type = 'video')::int AS video,
        COUNT(*) FILTER (WHERE type = 'picture')::int AS picture,
        COUNT(*) FILTER (WHERE type = 'quote')::int AS quote
      FROM ${CONTENT} WHERE "uploadedAt" >= ${from} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ date: string; views: number }[]>`
      SELECT to_char(date_trunc(${bucket}, "viewedAt"), 'YYYY-MM-DD') AS date, COUNT(*)::int AS views
      FROM content_views WHERE "viewedAt" >= ${from} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<PersonStat[]>`
      SELECT u.id AS "userId", u.name, u.image, COUNT(*)::int AS value FROM ${CONTENT}
      JOIN users u ON u.id = c."uploadedById" AND u.status <> 'DISABLED'
      WHERE c."uploadedAt" >= ${from} GROUP BY u.id, u.name, u.image ORDER BY value DESC LIMIT 5`,
    prisma.$queryRaw<PersonStat[]>`
      SELECT u.id AS "userId", u.name, u.image, COUNT(*)::int AS value FROM content_views v
      JOIN users u ON u.id = v."ownerId" AND u.status <> 'DISABLED'
      WHERE v."viewedAt" >= ${from} GROUP BY u.id, u.name, u.image ORDER BY value DESC LIMIT 5`,
    prisma.$queryRaw<PersonStat[]>`
      SELECT u.id AS "userId", u.name, u.image, COUNT(*)::int AS value FROM (
        SELECT "userId", "createdAt" FROM video_participants
        UNION ALL SELECT "userId", "createdAt" FROM picture_participants
        UNION ALL SELECT "userId", "createdAt" FROM quote_participants
      ) p JOIN users u ON u.id = p."userId" AND u.status <> 'DISABLED'
      WHERE p."createdAt" >= ${from} GROUP BY u.id, u.name, u.image ORDER BY value DESC LIMIT 5`,
    prisma.$queryRaw<PersonStat[]>`
      SELECT u.id AS "userId", u.name, u.image, COUNT(*)::int AS value FROM quote_messages m
      JOIN users u ON u.id = m."userId" AND u.status <> 'DISABLED'
      WHERE m."isContext" = false AND m."createdAt" >= ${from}
      GROUP BY u.id, u.name, u.image ORDER BY value DESC LIMIT 5`,
    prisma.$queryRaw<PersonStat[]>`
      SELECT u.id AS "userId", u.name, u.image, COUNT(*)::int AS value FROM comments c
      JOIN users u ON u.id = c."userId" AND u.status <> 'DISABLED'
      WHERE c."createdAt" >= ${from} GROUP BY u.id, u.name, u.image ORDER BY value DESC LIMIT 5`,
    prisma.$queryRaw<PersonStat[]>`
      SELECT u.id AS "userId", u.name, u.image, ROUND(AVG(r.value)::numeric, 2)::float AS value FROM ratings r
      JOIN users u ON u.id = r."userId" AND u.status <> 'DISABLED'
      WHERE r."createdAt" >= ${from} GROUP BY u.id, u.name, u.image HAVING COUNT(*) >= 3 ORDER BY value DESC LIMIT 3`,
    prisma.$queryRaw<PersonStat[]>`
      SELECT u.id AS "userId", u.name, u.image, ROUND(AVG(r.value)::numeric, 2)::float AS value FROM ratings r
      JOIN users u ON u.id = r."userId" AND u.status <> 'DISABLED'
      WHERE r."createdAt" >= ${from} GROUP BY u.id, u.name, u.image HAVING COUNT(*) >= 3 ORDER BY value ASC LIMIT 3`,
    prisma.$queryRaw<ContentStat[]>`
      SELECT type, id, title, views, "ratingAvg", "ratingCount", "commentCount" FROM ${CONTENT_WITH_COMMENTS}
      ORDER BY views DESC LIMIT 5`,
    prisma.$queryRaw<ContentStat[]>`
      SELECT type, id, title, views, "ratingAvg", "ratingCount", "commentCount" FROM ${CONTENT_WITH_COMMENTS}
      WHERE "ratingCount" >= 3 ORDER BY "ratingAvg" DESC, "ratingCount" DESC LIMIT 5`,
    prisma.$queryRaw<ContentStat[]>`
      SELECT type, id, title, views, "ratingAvg", "ratingCount", "commentCount" FROM ${CONTENT_WITH_COMMENTS}
      WHERE "commentCount" > 0 ORDER BY "commentCount" DESC LIMIT 5`,
    prisma.$queryRaw<ContentStat[]>`
      SELECT type, id, title, views, "ratingAvg", "ratingCount", "commentCount" FROM ${CONTENT_WITH_COMMENTS}
      WHERE "ratingCount" >= 2 AND "ratingAvg" >= 4 ORDER BY views ASC, "ratingAvg" DESC LIMIT 5`,
    prisma.$queryRaw<{ id: string; name: string; count: number; avgRating: number | null }[]>`
      SELECT cat.id, cat.name, COUNT(x.id)::int AS count,
        ROUND((SUM(x."ratingAvg" * x."ratingCount") / NULLIF(SUM(x."ratingCount"), 0))::numeric, 2)::float AS "avgRating"
      FROM categories cat
      LEFT JOIN (
        SELECT id, "categoryId", "ratingAvg", "ratingCount" FROM videos
        UNION ALL SELECT id, "categoryId", "ratingAvg", "ratingCount" FROM pictures
      ) x ON x."categoryId" = cat.id
      GROUP BY cat.id, cat.name ORDER BY count DESC`,
    prisma.$queryRaw<{ nameA: string; nameB: string; count: number }[]>`
      WITH parts AS (
        SELECT "userId", 'V' || "videoId" AS cid FROM video_participants
        UNION ALL SELECT "userId", 'P' || "pictureId" FROM picture_participants
        UNION ALL SELECT "userId", 'Q' || "quoteId" FROM quote_participants
      )
      SELECT ua.name AS "nameA", ub.name AS "nameB", COUNT(*)::int AS count
      FROM parts a JOIN parts b ON a.cid = b.cid AND a."userId" < b."userId"
      JOIN users ua ON ua.id = a."userId" AND ua.status <> 'DISABLED'
      JOIN users ub ON ub.id = b."userId" AND ub.status <> 'DISABLED'
      GROUP BY ua.name, ub.name ORDER BY count DESC LIMIT 5`,
    prisma.$queryRaw<{ last7: number; last30: number }[]>`
      SELECT
        COUNT(DISTINCT uid) FILTER (WHERE ts >= now() - interval '7 days')::int AS last7,
        COUNT(DISTINCT uid) FILTER (WHERE ts >= now() - interval '30 days')::int AS last30
      FROM (
        SELECT "userId" AS uid, "viewedAt" AS ts FROM content_views WHERE "userId" IS NOT NULL
        UNION ALL SELECT "userId", "createdAt" FROM comments
        UNION ALL SELECT "userId", "createdAt" FROM ratings
        UNION ALL SELECT "uploadedById", "uploadedAt" FROM ${CONTENT}
      ) t JOIN users u ON u.id = t.uid AND u.status <> 'DISABLED' AND u."isAnonymous" = false`,
    prisma.$queryRaw<{ type: "video" | "picture" | "quote"; id: string; title: string; year: number }[]>`
      SELECT type, id, title, EXTRACT(YEAR FROM "createdAt")::int AS year FROM ${CONTENT}
      WHERE EXTRACT(MONTH FROM "createdAt") = EXTRACT(MONTH FROM now())
        AND EXTRACT(DAY FROM "createdAt") = EXTRACT(DAY FROM now())
        AND EXTRACT(YEAR FROM "createdAt") < EXTRACT(YEAR FROM now())
      ORDER BY "createdAt" DESC LIMIT 6`,
  ])

  const status = (s: string) => memberStatus.find((m) => m.status === s)?._count._all ?? 0

  let admin: GroupAnalytics["admin"] = null
  if (includeAdmin) {
    const [pending, used, vb, pb, qb] = await Promise.all([
      prisma.invite.count({ where: { usedAt: null } }),
      prisma.invite.count({ where: { usedAt: { not: null } } }),
      prisma.video.count({ where: { isPublic: false } }),
      prisma.picture.count({ where: { isPublic: false } }),
      prisma.quote.count({ where: { isPublic: false } }),
    ])
    admin = { invites: { pending, used }, publishBacklog: { video: vb, picture: pb, quote: qb } }
  }

  return {
    totals: {
      video: typeCounts[0],
      picture: typeCounts[1],
      quote: typeCounts[2],
      publicCount: n(visibility[0]?.pub),
      privateCount: n(visibility[0]?.priv),
      members: { active: status("ACTIVE"), invited: status("INVITED"), disabled: status("DISABLED") },
      views: n(viewsTotal[0]?.total),
      comments: commentsTotal,
      ratings: ratingsTotal,
    },
    uploadsSeries: fillSeries(uploadsRows, ["video", "picture", "quote"], range),
    viewsSeries: fillSeries(viewsRows, ["views"], range),
    leaderboards: {
      topUploaders: people(topUploaders),
      mostViewedUploaders: people(mostViewedUploaders),
      mostTagged: people(mostTagged),
      mostQuoted: people(mostQuoted),
      topCommenters: people(topCommenters),
      generousRaters: people(generousRaters),
      strictRaters: people(strictRaters),
    },
    topContent: {
      mostViewed: content(mostViewed),
      topRated: content(topRated),
      mostCommented: content(mostCommented),
      hiddenGems: content(hiddenGems),
    },
    categories: categories.map((c) => ({ ...c, count: n(c.count), avgRating: c.avgRating == null ? null : Number(c.avgRating) })),
    topPairs: pairs.map((p) => ({ ...p, count: n(p.count) })),
    activeMembers: { last7: n(active[0]?.last7), last30: n(active[0]?.last30) },
    onThisDay: onThisDay.map((o) => ({ ...o, year: n(o.year) })),
    admin,
  }
}

const cachedGroupAnalytics = unstable_cache(
  async (rangeKey: string, includeAdmin: boolean) => computeGroupAnalytics(parseRangeKey(rangeKey), includeAdmin),
  ["analytics-group"],
  { tags: ["analytics"], revalidate: 300 }
)

/** Group-wide analytics, cached for 5 minutes (tag: "analytics"). */
export function getGroupAnalytics(rangeKey: RangeKey, includeAdmin: boolean): Promise<GroupAnalytics> {
  return cachedGroupAnalytics(rangeKey, includeAdmin)
}
