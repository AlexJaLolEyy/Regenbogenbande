import { Prisma } from "@/src/generated/prisma"

export const RANGE_KEYS = ["7d", "30d", "90d", "1y", "all"] as const
export type RangeKey = (typeof RANGE_KEYS)[number]
export type Bucket = "day" | "week" | "month"

export interface ResolvedRange {
  key: RangeKey
  /** Inclusive lower bound (epoch for "all"). */
  from: Date
  /** Previous period of equal length, for deltas. null for "all". */
  prev: { from: Date; to: Date } | null
  bucket: Bucket
  label: string
}

const DAY = 24 * 60 * 60 * 1000

const CONFIG: Record<Exclude<RangeKey, "all">, { days: number; bucket: Bucket; label: string }> = {
  "7d": { days: 7, bucket: "day", label: "Last 7 days" },
  "30d": { days: 30, bucket: "day", label: "Last 30 days" },
  "90d": { days: 90, bucket: "week", label: "Last 90 days" },
  "1y": { days: 365, bucket: "month", label: "Last year" },
}

export function parseRangeKey(value: string | undefined | null): RangeKey {
  return (RANGE_KEYS as readonly string[]).includes(value ?? "") ? (value as RangeKey) : "30d"
}

export function resolveRange(key: RangeKey, now = new Date()): ResolvedRange {
  if (key === "all") {
    return { key, from: new Date(0), prev: null, bucket: "month", label: "All time" }
  }
  const { days, bucket, label } = CONFIG[key]
  const from = new Date(now.getTime() - days * DAY)
  return { key, from, prev: { from: new Date(from.getTime() - days * DAY), to: from }, bucket, label }
}

/** Safe SQL fragment for date_trunc units (whitelisted, never user input). */
export function bucketSql(bucket: Bucket) {
  return Prisma.raw(`'${bucket}'`)
}

export interface SeriesPoint {
  date: string // YYYY-MM-DD (start of bucket)
  [series: string]: number | string
}

function startOfBucket(d: Date, bucket: Bucket): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  if (bucket === "week") {
    const dow = (x.getUTCDay() + 6) % 7 // Monday = 0
    x.setUTCDate(x.getUTCDate() - dow)
  } else if (bucket === "month") {
    x.setUTCDate(1)
  }
  return x
}

function nextBucket(d: Date, bucket: Bucket): Date {
  const x = new Date(d)
  if (bucket === "day") x.setUTCDate(x.getUTCDate() + 1)
  else if (bucket === "week") x.setUTCDate(x.getUTCDate() + 7)
  else x.setUTCMonth(x.getUTCMonth() + 1)
  return x
}

/**
 * Fills empty buckets with zeros so charts show gaps honestly.
 * `rows` is [{ date: 'YYYY-MM-DD', <series>: n }, ...] keyed by series names.
 */
export function fillSeries(
  rows: { date: string; [k: string]: number | string }[],
  seriesKeys: string[],
  range: ResolvedRange
): SeriesPoint[] {
  const byDate = new Map(rows.map((r) => [r.date, r]))
  const first =
    range.key === "all"
      ? rows.length > 0
        ? new Date(`${rows[0].date}T00:00:00Z`)
        : null
      : startOfBucket(range.from, range.bucket)
  if (!first) return []

  const out: SeriesPoint[] = []
  const end = new Date()
  for (let d = first; d <= end; d = nextBucket(d, range.bucket)) {
    const date = d.toISOString().slice(0, 10)
    const existing = byDate.get(date)
    const point: SeriesPoint = { date }
    for (const k of seriesKeys) point[k] = Number(existing?.[k] ?? 0)
    out.push(point)
  }
  return out
}
