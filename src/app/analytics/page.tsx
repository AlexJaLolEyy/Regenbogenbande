import { RANGE_KEYS, parseRangeKey, resolveRange } from "@/src/lib/analytics/range";
import { getEffectiveRole, getSession } from "@/src/lib/auth-utils";
import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GroupSections } from "./group-sections";
import { MeSections } from "./me-sections";
import { SectionSkeleton } from "./parts";

export const metadata = { title: "Statistics" };

const RANGE_LABELS: Record<(typeof RANGE_KEYS)[number], string> = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
    "1y": "1 year",
    all: "All time",
};

const pill = (active: boolean) =>
    cn(
        "rounded-lg px-4 py-2 text-sm transition-colors",
        active ? "bg-accent-soft font-medium text-theme-accent" : "text-muted-foreground hover:text-foreground"
    );

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; range?: string }>;
}) {
    const session = await getSession();
    const role = getEffectiveRole(session);
    if (!session?.user || role === "guest") redirect("/");

    const params = await searchParams;
    const tab = params.tab === "group" ? "group" : "me";
    const rangeKey = parseRangeKey(params.range);
    const range = resolveRange(rangeKey);
    const href = (t: string, r: string) => `/analytics?tab=${t}&range=${r}`;

    return (
        <div className="w-full text-foreground">
            <div className="container mx-auto max-w-6xl p-6 pt-8">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-semibold tracking-tight md:text-3xl">Statistics</h1>
                    <p className="text-sm text-muted-foreground">
                        {tab === "me" ? "Your activity and the reach of your uploads" : "How the whole Bande is doing"} · {range.label}
                    </p>
                </div>

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex gap-1 rounded-xl border border-border bg-card/70 p-1">
                        <Link href={href("me", rangeKey)} className={pill(tab === "me")} aria-current={tab === "me" ? "page" : undefined}>Me</Link>
                        <Link href={href("group", rangeKey)} className={pill(tab === "group")} aria-current={tab === "group" ? "page" : undefined}>Group</Link>
                    </div>
                    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted p-1">
                        {RANGE_KEYS.map((r) => (
                            <Link key={r} href={href(tab, r)} className={pill(r === rangeKey)} aria-current={r === rangeKey ? "true" : undefined}>
                                {RANGE_LABELS[r]}
                            </Link>
                        ))}
                    </div>
                </div>

                <p className="mb-6 text-xs text-faint">
                    View charts only count views recorded since detailed view tracking was introduced; lifetime view totals include older views.
                </p>

                <Suspense
                    key={`${tab}-${rangeKey}`}
                    fallback={
                        <div className="grid gap-6">
                            <SectionSkeleton height="h-28" />
                            <SectionSkeleton />
                            <SectionSkeleton />
                        </div>
                    }
                >
                    {tab === "me" ? (
                        <MeSections userId={session.user.id} range={range} />
                    ) : (
                        <GroupSections range={rangeKey} isAdmin={role === "owner" || role === "admin"} />
                    )}
                </Suspense>
            </div>
        </div>
    );
}
