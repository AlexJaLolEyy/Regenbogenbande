import { Prisma } from "@/src/generated/prisma"
import { prisma } from "@/src/lib/prisma"
import { bucketSql, fillSeries, type ResolvedRange, type SeriesPoint } from "./range"

export interface MeAnalytics {
  kpis: {
    uploads: { total: number; video: number; picture: number; quote: number }
    viewsReceived: { current: number; previous: number | null }
    avgRatingReceived: number | null
    ratingsGiven: number
    commentsWritten: number
    commentKarma: number
    timesTagged: number
    timesQuoted: number
  }
  uploadsSeries: SeriesPoint[]
  viewsSeries: SeriesPoint[]
  ratingDistribution: { received: number[]; given: number[] }
  topByViews: TopItem[]
  topByRating: TopItem[]
  seenProgress: { type: "video" | "picture" | "quote"; seen: number; total: number }[]
  friends: { userId: string; name: string; image: string | null; count: number }[]
  /** 7 rows (Mon..Sun) x 24 hours */
  heatmap: number[][]
}

export interface TopItem {
  type: "video" | "picture" | "quote"
  id: string
  title: string
  views: number
  ratingAvg: number | null
  ratingCount: number
}

const n = (v: unknown) => Number(v ?? 0)

/** All content rows in one relation, for cross-type queries. */
const CONTENT = Prisma.sql`(
  SELECT 'video'::text AS type, id, title, views, "ratingAvg", "ratingCount", "uploadedById", "uploadedAt" FROM videos
  UNION ALL
  SELECT 'picture'::text, id, title, views, "ratingAvg", "ratingCount", "uploadedById", "uploadedAt" FROM pictures
  UNION ALL
  SELECT 'quote'::text, q.id,
    COALESCE((SELECT left(m.message, 60) FROM quote_messages m WHERE m."quoteId" = q.id AND m."isContext" = false ORDER BY m."createdAt" LIMIT 1), 'Quote'),
    q.views, q."ratingAvg", q."ratingCount", q."uploadedById", q."uploadedAt" FROM quotes q
) c`

export async function getMeAnalytics(userId: string, range: ResolvedRange): Promise<MeAnalytics> {
  const from = range.from
  const bucket = bucketSql(range.bucket)

  const [
    uploadCounts,
    viewsCurrent,
    viewsPrevious,
    ratingReceived,
    ratingsGiven,
    commentsWritten,
    karma,
    tagged,
    quoted,
    uploadsRows,
    viewsRows,
    receivedDist,
    givenDist,
    topByViews,
    topByRating,
    seen,
    totals,
    friends,
    heat,
  ] = await Promise.all([
    prisma.$queryRaw<{ type: string; count: number }[]>`
      SELECT type, COUNT(*)::int AS count FROM ${CONTENT}
      WHERE "uploadedById" = ${userId} AND "uploadedAt" >= ${from} GROUP BY type`,
    prisma.contentView.count({ where: { ownerId: userId, viewedAt: { gte: from } } }),
    range.prev
      ? prisma.contentView.count({ where: { ownerId: userId, viewedAt: { gte: range.prev.from, lt: range.prev.to } } })
      : Promise.resolve(null),
    prisma.$queryRaw<{ avg: number | null }[]>`
      SELECT AVG(r.value) AS avg FROM ratings r
      LEFT JOIN videos v ON v.id = r."videoId"
      LEFT JOIN pictures p ON p.id = r."pictureId"
      LEFT JOIN quotes q ON q.id = r."quoteId"
      WHERE COALESCE(v."uploadedById", p."uploadedById", q."uploadedById") = ${userId}`,
    prisma.rating.count({ where: { userId, createdAt: { gte: from } } }),
    prisma.comment.count({ where: { userId, createdAt: { gte: from } } }),
    prisma.$queryRaw<{ karma: number }[]>`
      SELECT COALESCE(SUM(v.value), 0)::int AS karma FROM comment_votes v
      JOIN comments c ON c.id = v."commentId" WHERE c."userId" = ${userId}`,
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM (
        SELECT "createdAt" FROM video_participants WHERE "userId" = ${userId}
        UNION ALL SELECT "createdAt" FROM picture_participants WHERE "userId" = ${userId}
        UNION ALL SELECT "createdAt" FROM quote_participants WHERE "userId" = ${userId}
      ) t WHERE "createdAt" >= ${from}`,
    prisma.quoteMessage.count({ where: { userId, isContext: false, createdAt: { gte: from } } }),
    prisma.$queryRaw<{ date: string; video: number; picture: number; quote: number }[]>`
      SELECT to_char(date_trunc(${bucket}, "uploadedAt"), 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE type = 'video')::int AS video,
        COUNT(*) FILTER (WHERE type = 'picture')::int AS picture,
        COUNT(*) FILTER (WHERE type = 'quote')::int AS quote
      FROM ${CONTENT} WHERE "uploadedById" = ${userId} AND "uploadedAt" >= ${from}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ date: string; views: number }[]>`
      SELECT to_char(date_trunc(${bucket}, "viewedAt"), 'YYYY-MM-DD') AS date, COUNT(*)::int AS views
      FROM content_views WHERE "ownerId" = ${userId} AND "viewedAt" >= ${from}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ stars: number; count: number }[]>`
      SELECT round(r.value)::int AS stars, COUNT(*)::int AS count FROM ratings r
      LEFT JOIN videos v ON v.id = r."videoId"
      LEFT JOIN pictures p ON p.id = r."pictureId"
      LEFT JOIN quotes q ON q.id = r."quoteId"
      WHERE COALESCE(v."uploadedById", p."uploadedById", q."uploadedById") = ${userId}
      GROUP BY 1`,
    prisma.$queryRaw<{ stars: number; count: number }[]>`
      SELECT round(value)::int AS stars, COUNT(*)::int AS count FROM ratings WHERE "userId" = ${userId} GROUP BY 1`,
    prisma.$queryRaw<TopItem[]>`
      SELECT type, id, title, views, "ratingAvg", "ratingCount" FROM ${CONTENT}
      WHERE "uploadedById" = ${userId} ORDER BY views DESC LIMIT 5`,
    prisma.$queryRaw<TopItem[]>`
      SELECT type, id, title, views, "ratingAvg", "ratingCount" FROM ${CONTENT}
      WHERE "uploadedById" = ${userId} AND "ratingCount" > 0
      ORDER BY "ratingAvg" DESC, "ratingCount" DESC LIMIT 5`,
    prisma.$queryRaw<{ type: string; seen: number }[]>`
      SELECT 'video'::text AS type, COUNT(*)::int AS seen FROM user_video_views WHERE "userId" = ${userId}
      UNION ALL SELECT 'picture', COUNT(*)::int FROM user_picture_views WHERE "userId" = ${userId}
      UNION ALL SELECT 'quote', COUNT(*)::int FROM user_quote_views WHERE "userId" = ${userId}`,
    Promise.all([prisma.video.count(), prisma.picture.count(), prisma.quote.count()]),
    prisma.$queryRaw<{ userId: string; name: string; image: string | null; count: number }[]>`
      WITH parts AS (
        SELECT "userId", 'V' || "videoId" AS cid FROM video_participants
        UNION ALL SELECT "userId", 'P' || "pictureId" FROM picture_participants
        UNION ALL SELECT "userId", 'Q' || "quoteId" FROM quote_participants
      )
      SELECT b."userId" AS "userId", u.name, u.image, COUNT(*)::int AS count
      FROM parts a JOIN parts b ON a.cid = b.cid AND a."userId" <> b."userId"
      JOIN users u ON u.id = b."userId" AND u.status <> 'DISABLED'
      WHERE a."userId" = ${userId}
      GROUP BY b."userId", u.name, u.image ORDER BY count DESC LIMIT 8`,
    prisma.$queryRaw<{ dow: number; hour: number; count: number }[]>`
      SELECT ((EXTRACT(ISODOW FROM ts AT TIME ZONE 'Europe/Berlin')::int) - 1) AS dow,
             EXTRACT(HOUR FROM ts AT TIME ZONE 'Europe/Berlin')::int AS hour, COUNT(*)::int AS count
      FROM (
        SELECT "uploadedAt" AS ts FROM ${CONTENT} WHERE "uploadedById" = ${userId}
        UNION ALL SELECT "createdAt" FROM comments WHERE "userId" = ${userId}
        UNION ALL SELECT "createdAt" FROM ratings WHERE "userId" = ${userId}
      ) t WHERE ts >= ${from} GROUP BY 1, 2`,
  ])

  const upload = (type: string) => n(uploadCounts.find((r) => r.type === type)?.count)
  const dist = (rows: { stars: number; count: number }[]) =>
    [1, 2, 3, 4, 5].map((s) => n(rows.find((r) => r.stars === s)?.count))
  const seenOf = (t: string) => n(seen.find((r) => r.type === t)?.seen)

  const heatmap = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
  for (const h of heat) heatmap[n(h.dow)][n(h.hour)] = n(h.count)

  const normalize = (rows: TopItem[]): TopItem[] =>
    rows.map((r) => ({ ...r, views: n(r.views), ratingCount: n(r.ratingCount), ratingAvg: r.ratingAvg == null ? null : Number(r.ratingAvg) }))

  return {
    kpis: {
      uploads: {
        total: upload("video") + upload("picture") + upload("quote"),
        video: upload("video"),
        picture: upload("picture"),
        quote: upload("quote"),
      },
      viewsReceived: { current: viewsCurrent, previous: viewsPrevious },
      avgRatingReceived: ratingReceived[0]?.avg == null ? null : Number(ratingReceived[0].avg),
      ratingsGiven,
      commentsWritten,
      commentKarma: n(karma[0]?.karma),
      timesTagged: n(tagged[0]?.count),
      timesQuoted: quoted,
    },
    uploadsSeries: fillSeries(uploadsRows, ["video", "picture", "quote"], range),
    viewsSeries: fillSeries(viewsRows, ["views"], range),
    ratingDistribution: { received: dist(receivedDist), given: dist(givenDist) },
    topByViews: normalize(topByViews),
    topByRating: normalize(topByRating),
    seenProgress: [
      { type: "video", seen: seenOf("video"), total: totals[0] },
      { type: "picture", seen: seenOf("picture"), total: totals[1] },
      { type: "quote", seen: seenOf("quote"), total: totals[2] },
    ],
    friends: friends.map((f) => ({ ...f, count: n(f.count) })),
    heatmap,
  }
}
