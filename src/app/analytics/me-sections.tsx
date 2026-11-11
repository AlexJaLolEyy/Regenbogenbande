import { getMeAnalytics } from "@/src/lib/analytics/me";
import type { ResolvedRange } from "@/src/lib/analytics/range";
import { Heatmap, RatingBars, UploadsChart, ViewsChart } from "@/src/lib/components/analytics/charts-lazy";
import { StatTile } from "@/src/lib/components/ui/stat-tile";
import { Eye, Film, MessageSquare, Star, Tag, ThumbsUp, Upload, Quote } from "lucide-react";
import Link from "next/link";
import { ChartBox, ContentList, Section } from "./parts";

const pct = (cur: number, prev: number | null) => (prev == null || prev === 0 ? null : ((cur - prev) / prev) * 100);

export async function MeSections({ userId, range }: { userId: string; range: ResolvedRange }) {
    const d = await getMeAnalytics(userId, range);
    const { kpis } = d;
    const hasUploads = d.uploadsSeries.some((p) => Number(p.video) + Number(p.picture) + Number(p.quote) > 0);
    const hasViews = d.viewsSeries.some((p) => Number(p.views) > 0);
    const hasHeat = d.heatmap.some((row) => row.some((c) => c > 0));

    return (
        <div className="flex flex-col gap-6">
            {kpis.uploads.total === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-10 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-theme-accent"><Film size={20} /></span>
                    <div>
                        <p className="font-medium">No uploads in this period</p>
                        <p className="text-sm text-muted-foreground">Your upload statistics will show up here.</p>
                    </div>
                    <Link href="/videos/upload" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
                        Upload your first clip
                    </Link>
                </div>
            )}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatTile
                    label="Uploads"
                    icon={Upload}
                    value={kpis.uploads.total}
                    color="var(--theme-accent)"
                    hint={`${kpis.uploads.video} videos · ${kpis.uploads.picture} pictures · ${kpis.uploads.quote} quotes`}
                />
                <StatTile
                    label="Views received"
                    icon={Eye}
                    value={kpis.viewsReceived.current}
                    color="var(--chart-2)"
                    delta={pct(kpis.viewsReceived.current, kpis.viewsReceived.previous)}
                    hint={kpis.viewsReceived.previous != null ? "vs previous period" : undefined}
                />
                <StatTile
                    label="Average rating received"
                    icon={Star}
                    value={kpis.avgRatingReceived != null ? kpis.avgRatingReceived.toFixed(1) : "–"}
                    color="var(--gold)"
                    hint="all time"
                />
                <StatTile icon={ThumbsUp} label="Ratings given" value={kpis.ratingsGiven} color="var(--chart-3)" />
                <StatTile icon={MessageSquare} label="Comments written" value={kpis.commentsWritten} />
                <StatTile icon={ThumbsUp} label="Comment karma" value={kpis.commentKarma} hint="net votes, all time" />
                <StatTile icon={Tag} label="Times tagged" value={kpis.timesTagged} />
                <StatTile icon={Quote} label="Times quoted" value={kpis.timesQuoted} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="Uploads over time">
                    <ChartBox empty={!hasUploads}><UploadsChart data={d.uploadsSeries} /></ChartBox>
                </Section>
                <Section title="Views received over time">
                    <ChartBox empty={!hasViews}><ViewsChart data={d.viewsSeries} /></ChartBox>
                </Section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="Ratings: received vs given (all time)">
                    <ChartBox empty={[...d.ratingDistribution.received, ...d.ratingDistribution.given].every((v) => v === 0)}>
                        <RatingBars received={d.ratingDistribution.received} given={d.ratingDistribution.given} />
                    </ChartBox>
                </Section>
                <Section title="Seen progress">
                    <ul className="space-y-4">
                        {d.seenProgress.map((p) => {
                            const percent = p.total > 0 ? Math.min(100, Math.round((p.seen / p.total) * 100)) : 0;
                            return (
                                <li key={p.type}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="capitalize">{p.type}s</span>
                                        <span className="font-mono text-muted-foreground">
                                            {p.seen} / {p.total} ({percent}%)
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-theme-accent" style={{ width: `${percent}%` }} />
                                    </div>
                                    {p.seen < p.total && (
                                        <Link href={`/${p.type}s`} className="mt-1 inline-block text-xs text-faint hover:underline">
                                            Browse {p.type}s
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </Section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Section title="My top content by views"><ContentList rows={d.topByViews} metric="views" /></Section>
                <Section title="My top content by rating"><ContentList rows={d.topByRating} metric="rating" /></Section>
                <Section title="Friends I appear with most">
                    {d.friends.length === 0 ? (
                        <p className="text-sm text-faint">Nothing yet.</p>
                    ) : (
                        <ol className="space-y-2">
                            {d.friends.map((f, i) => (
                                <li key={f.userId} className="flex items-center gap-3 text-sm">
                                    <span className="w-4 text-xs text-faint">{i + 1}</span>
                                    <span className="flex-1 truncate">{f.name}</span>
                                    <span className="font-mono text-muted-foreground">{f.count}×</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </Section>
            </div>

            <Section title="Activity by weekday and hour (uploads, comments, ratings)">
                {hasHeat ? <Heatmap data={d.heatmap} /> : <p className="py-6 text-center text-sm text-faint">No activity in this period.</p>}
            </Section>
        </div>
    );
}
