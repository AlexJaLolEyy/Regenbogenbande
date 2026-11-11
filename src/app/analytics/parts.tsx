import { GlassCard } from "@/src/lib/components/ui/glass-card";
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import Link from "next/link";
import React from "react";

export const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
    <GlassCard hoverEffect={false} className={`p-6 ${className ?? ""}`}>
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h3>
        {children}
    </GlassCard>
);

export const ChartBox = ({ children, empty }: { children: React.ReactNode; empty?: boolean }) =>
    empty ? (
        <p className="py-10 text-center text-sm text-faint">No data for this period yet.</p>
    ) : (
        <div className="h-64">{children}</div>
    );

export const SectionSkeleton = ({ height = "h-64" }: { height?: string }) => (
    <div className={`${height} animate-pulse rounded-2xl border border-border bg-muted/50`} />
);

export const contentHref = (type: "video" | "picture" | "quote", id: string) =>
    `/${type === "quote" ? "quotes" : type + "s"}/${id}`;

export function PeopleList({
    rows,
    unit,
    decimals = 0,
}: {
    rows: { userId: string; name: string; image: string | null; value: number }[];
    unit?: string;
    decimals?: number;
}) {
    if (rows.length === 0) return <p className="text-sm text-faint">Nothing yet.</p>;
    return (
        <ol className="space-y-2">
            {rows.map((r, i) => (
                <li key={r.userId} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-xs text-faint">{i + 1}</span>
                    <UserAvatar src={r.image || undefined} name={r.name?.[0]} className="h-7 w-7 text-xs" />
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="font-mono text-muted-foreground">
                        {r.value.toFixed(decimals)}
                        {unit ? ` ${unit}` : ""}
                    </span>
                </li>
            ))}
        </ol>
    );
}

export function ContentList({
    rows,
    metric,
}: {
    rows: { type: "video" | "picture" | "quote"; id: string; title: string; views: number; ratingAvg: number | null; ratingCount: number; commentCount?: number }[];
    metric: "views" | "rating" | "comments";
}) {
    if (rows.length === 0) return <p className="text-sm text-faint">Nothing yet.</p>;
    return (
        <ol className="space-y-2">
            {rows.map((r, i) => (
                <li key={`${r.type}-${r.id}`} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-xs text-faint">{i + 1}</span>
                    <Link href={contentHref(r.type, r.id)} className="flex-1 truncate hover:underline">
                        {r.title || "Untitled"}
                    </Link>
                    <span className="text-[11px] uppercase tracking-wide text-faint">{r.type}</span>
                    <span className="w-20 text-right font-mono text-muted-foreground">
                        {metric === "views" && `${r.views} views`}
                        {metric === "rating" && `${(r.ratingAvg ?? 0).toFixed(1)} ★ (${r.ratingCount})`}
                        {metric === "comments" && `${r.commentCount ?? 0} comments`}
                    </span>
                </li>
            ))}
        </ol>
    );
}
