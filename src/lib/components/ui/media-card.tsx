"use client";

import { cn } from "@/src/lib/utils";
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { formatDate, relativeDate } from "@/src/lib/utils/format";
import { DURATION, EASE, HOVER_LIFT } from "@/src/lib/motion";
import React from "react";
import type { User } from "../../types/types";
import { Rating } from "../shared/rating";

/** One grid language for every media list (videos, pictures, quotes). */
export const LIST_GRID =
    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6";
export const LIST_MASONRY =
    "columns-1 md:columns-2 lg:columns-3 2xl:columns-4 gap-6";

/** Card surface: token glass, 2px lift + stronger shadow on hover, no colored glow. */
export const MediaCard = ({
    children,
    className,
    isNew,
}: {
    children: React.ReactNode;
    className?: string;
    /** Shows a small "New" badge for content the current user has not seen yet */
    isNew?: boolean;
}) => (
    <motion.div
        whileHover={HOVER_LIFT}
        transition={{ duration: DURATION.base, ease: EASE }}
        className={cn(
            "group relative overflow-hidden rounded-2xl border border-border bg-card/70 text-card-foreground shadow-sm backdrop-blur-md",
            "transition-[background-color,border-color,box-shadow] duration-200 hover:border-foreground/20 hover:bg-card/90 hover:shadow-lg",
            className
        )}
    >
        {isNew && (
            <span className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-theme-accent" />
                New
            </span>
        )}
        {children}
    </motion.div>
);

/** Small date/category pill that sits on top of media. */
export const MediaPill = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span
        className={cn(
            "rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md",
            className
        )}
    >
        {children}
    </span>
);

export const UserChip = ({ user, className }: { user?: User | null; className?: string }) => (
    <span className={cn("flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <UserAvatar
            src={user?.profilePicture || undefined}
            name={user?.username?.[0]?.toUpperCase() || "?"}
            className="h-5 w-5 shrink-0 text-[11px]"
        />
        <span className="max-w-24 truncate">{user?.username || "Unknown"}</span>
    </span>
);

export const Views = ({ count }: { count?: number }) => (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Eye size={12} />
        {count || 0}
    </span>
);

/** Stacked participant avatars with "+N" overflow. */
export const ParticipantStack = ({ participants, max = 3, tone = "overlay" }: { participants: User[]; max?: number; tone?: "overlay" | "card" }) => {
    if (!participants?.length) return null;
    const shown = participants.slice(0, max);
    const rest = participants.length - shown.length;
    return (
        <div className="flex items-center">
            {shown.map((p) => (
                <UserAvatar
                    key={p.id}
                    src={p.profilePicture || undefined}
                    name={p.username?.[0]?.toUpperCase()}
                    title={p.username}
                    className={cn("-ml-2 h-6 w-6 border-2 text-[11px] first:ml-0", tone === "card" ? "border-card" : "border-black/60")}
                />
            ))}
            {rest > 0 && (
                <span className={cn("-ml-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 px-1 text-[11px] font-medium", tone === "card" ? "border-card bg-muted text-muted-foreground" : "border-black/60 bg-black/70 text-white")}>
                    +{rest}
                </span>
            )}
        </div>
    );
};

/** Card title: 15px, 2 lines reserved so grid rows stay aligned. */
export const CardTitle = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug text-foreground" title={title}>
        {children}
    </h3>
);

/** Thumbnail image classes: zooms inside its overflow-hidden parent on card hover. */
export const THUMB_ZOOM = "transition-transform duration-500 ease-out group-hover:scale-[1.04]";

/** Overlay that shows on hover, and always on touch devices. */
export const HOVER_REVEAL = "opacity-0 transition duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-100";

/** One-line footer meta shared by video/picture/quote cards: avatar, name, relative date | views, rating. */
export const CardMeta = ({
    user,
    date,
    views,
    rating,
}: {
    user?: User | null;
    date?: Date | string;
    views?: number;
    rating?: number | null;
}) => (
    <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <UserChip user={user} className="min-w-0" />
            {date && (
                <>
                    <span aria-hidden>·</span>
                    <span className="shrink-0 whitespace-nowrap" title={formatDate(date)}>{relativeDate(date)}</span>
                </>
            )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
            <Views count={views} />
            <Rating value={rating} />
        </div>
    </div>
);
/** Shared skeleton card for all list types. `media` = thumbnail aspect class. */
export const CardSkeleton = ({ media = "aspect-video", className }: { media?: string; className?: string }) => (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card/70", className)}>
        <Skeleton className={cn("w-full rounded-none", media)} />
        <div className="space-y-3 p-3">
            <Skeleton className="h-4 w-3/4 rounded" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-3 w-1/4 rounded" />
            </div>
        </div>
    </div>
);

/** Tokened content box used by every media list page. */
export const ListPanel = ({
    title,
    subtitle,
    headerRight,
    footer,
    scrollResetKey,
    children,
}: {
    title: string;
    subtitle?: string;
    headerRight?: React.ReactNode;
    footer?: React.ReactNode;
    /** When this value changes (e.g. the page number) the list scrolls back to the top */
    scrollResetKey?: unknown;
    children: React.ReactNode;
}) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [scrollResetKey]);

    return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-sm">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scrollbar-hide md:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pl-1">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
                    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                {headerRight}
            </div>
            {children}
        </div>
        {footer && (
            <div className="z-10 flex shrink-0 justify-center border-t border-divider bg-surface/90 p-4 backdrop-blur-md">
                {footer}
            </div>
        )}
    </div>
    );
};

export const EmptyState = ({ title, hint }: { title: string; hint?: string }) => (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium text-foreground">{title}</p>
        {hint && <p className="text-sm">{hint}</p>}
    </div>
);
