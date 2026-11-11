import { getGroupAnalytics } from "@/src/lib/analytics/group";
import type { RangeKey } from "@/src/lib/analytics/range";
import { TypeDoughnut, UploadsChart, ViewsChart } from "@/src/lib/components/analytics/charts-lazy";
import { StatTile } from "@/src/lib/components/ui/stat-tile";
import Link from "next/link";
import { ChartBox, ContentList, PeopleList, Section, contentHref } from "./parts";

export async function GroupSections({ range, isAdmin }: { range: RangeKey; isAdmin: boolean }) {
    const d = await getGroupAnalytics(range, isAdmin);
    const { totals, leaderboards: lb, topContent: tc } = d;
    const totalContent = totals.video + totals.picture + totals.quote;
    const hasUploads = d.uploadsSeries.some((p) => Number(p.video) + Number(p.picture) + Number(p.quote) > 0);
    const hasViews = d.viewsSeries.some((p) => Number(p.views) > 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatTile
                    label="Content"
                    value={totalContent}
                    color="var(--theme-accent)"
                    hint={`${totals.video} videos · ${totals.picture} pictures · ${totals.quote} quotes`}
                />
                <StatTile label="Public / private" value={`${totals.publicCount} / ${totals.privateCount}`} />
                <StatTile
                    label="Members"
                    value={totals.members.active}
                    hint={`${totals.members.invited} invited · ${totals.members.disabled} disabled`}
                />
                <StatTile label="Total views" value={totals.views} color="var(--chart-2)" hint="lifetime counters" />
                <StatTile label="Comments" value={totals.comments} />
                <StatTile label="Ratings" value={totals.ratings} color="var(--gold)" />
                <StatTile label="Active last 7 days" value={d.activeMembers.last7} hint="members" />
                <StatTile label="Active last 30 days" value={d.activeMembers.last30} hint="members" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Section title="Uploads over time" className="lg:col-span-2">
                    <ChartBox empty={!hasUploads}><UploadsChart data={d.uploadsSeries} /></ChartBox>
                </Section>
                <Section title="Content by type">
                    <ChartBox empty={totalContent === 0}>
                        <TypeDoughnut video={totals.video} picture={totals.picture} quote={totals.quote} />
                    </ChartBox>
                </Section>
            </div>

            <Section title="Views over time">
                <ChartBox empty={!hasViews}><ViewsChart data={d.viewsSeries} /></ChartBox>
            </Section>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Section title="Top uploaders"><PeopleList rows={lb.topUploaders} unit="uploads" /></Section>
                <Section title="Most viewed uploader"><PeopleList rows={lb.mostViewedUploaders} unit="views" /></Section>
                <Section title="Star der Bande (most tagged)"><PeopleList rows={lb.mostTagged} unit="tags" /></Section>
                <Section title="Most quoted"><PeopleList rows={lb.mostQuoted} unit="quotes" /></Section>
                <Section title="Top commenters"><PeopleList rows={lb.topCommenters} unit="comments" /></Section>
                <Section title="Most generous / strictest rater">
                    <p className="mb-2 text-xs text-faint">Generous (min. 3 ratings)</p>
                    <PeopleList rows={lb.generousRaters.slice(0, 1)} unit="★" decimals={2} />
                    <p className="mb-2 mt-4 text-xs text-faint">Strictest</p>
                    <PeopleList rows={lb.strictRaters.slice(0, 1)} unit="★" decimals={2} />
                </Section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="Most viewed"><ContentList rows={tc.mostViewed} metric="views" /></Section>
                <Section title="Top rated (min. 3 ratings)"><ContentList rows={tc.topRated} metric="rating" /></Section>
                <Section title="Most commented"><ContentList rows={tc.mostCommented} metric="comments" /></Section>
                <Section title="Hidden gems (high rating, few views)"><ContentList rows={tc.hiddenGems} metric="rating" /></Section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="Categories (videos and pictures)">
                    <ul className="space-y-2 text-sm">
                        {d.categories.map((c) => (
                            <li key={c.id} className="flex items-center gap-3">
                                <span className="flex-1 truncate">{c.name}</span>
                                <span className="font-mono text-muted-foreground">{c.count}</span>
                                <span className="w-14 text-right font-mono text-faint">{c.avgRating != null ? `${c.avgRating.toFixed(1)} ★` : "–"}</span>
                            </li>
                        ))}
                        {d.categories.length === 0 && <li className="text-faint">No categories yet.</li>}
                    </ul>
                </Section>
                <Section title="Top pairs (appear together most)">
                    <ol className="space-y-2 text-sm">
                        {d.topPairs.map((p, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <span className="w-4 text-xs text-faint">{i + 1}</span>
                                <span className="flex-1 truncate">{p.nameA} &amp; {p.nameB}</span>
                                <span className="font-mono text-muted-foreground">{p.count}×</span>
                            </li>
                        ))}
                        {d.topPairs.length === 0 && <li className="text-faint">Nothing yet.</li>}
                    </ol>
                </Section>
            </div>

            <Section title="On this day">
                {d.onThisDay.length === 0 ? (
                    <p className="text-sm text-faint">Nothing happened on this date in earlier years.</p>
                ) : (
                    <ul className="space-y-2 text-sm">
                        {d.onThisDay.map((o) => (
                            <li key={`${o.type}-${o.id}`} className="flex items-center gap-3">
                                <span className="w-12 font-mono text-xs text-faint">{o.year}</span>
                                <Link href={contentHref(o.type, o.id)} className="flex-1 truncate hover:underline">{o.title || "Untitled"}</Link>
                                <span className="text-[11px] uppercase tracking-wide text-faint">{o.type}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Section>

            {d.admin && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <StatTile
                        label="Invites (admin)"
                        value={`${d.admin.invites.pending} pending`}
                        hint={`${d.admin.invites.used} used`}
                    />
                    <StatTile
                        label="Publish backlog (admin)"
                        value={d.admin.publishBacklog.video + d.admin.publishBacklog.picture + d.admin.publishBacklog.quote}
                        hint={`${d.admin.publishBacklog.video} videos · ${d.admin.publishBacklog.picture} pictures · ${d.admin.publishBacklog.quote} quotes private`}
                    />
                </div>
            )}
        </div>
    );
}
