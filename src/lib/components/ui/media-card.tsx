"use client";

import { cn } from "@/src/lib/utils";
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import React from "react";
import type { User } from "../../types/types";
import { Rating } from "../shared/rating";

/** One grid language for every media list (videos, pictures, quotes). */
export const LIST_GRID =
    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6";
export const LIST_MASONRY =
    "columns-1 md:columns-2 lg:columns-3 2xl:columns-4 gap-6";

/** Shared hover scale for all media cards. */
export const CARD_HOVER_SCALE = 1.02;

/** Card surface: token glass, subtle lift on hover, no colored glow. */
export const MediaCard = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <motion.div
        whileHover={{ scale: CARD_HOVER_SCALE }}
        className={cn(
            "group relative overflow-hidden rounded-2xl border border-border bg-card/70 text-card-foreground shadow-sm backdrop-blur-md",
            "transition-[background-color,border-color,box-shadow] duration-200 hover:border-foreground/20 hover:bg-card/90 hover:shadow-md",
            className
        )}
    >
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
            className="h-5 w-5 shrink-0 text-[10px]"
        />
        <span className="max-w-28 truncate">{user?.username || "Unknown"}</span>
    </span>
);

export const Views = ({ count }: { count?: number }) => (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Eye size={12} />
        {count || 0}
    </span>
);

/** Stacked participant avatars with "+N" overflow. */
export const ParticipantStack = ({ participants, max = 3 }: { participants: User[]; max?: number }) => {
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
                    className="-ml-2 h-6 w-6 border-2 border-black/60 text-[10px] first:ml-0"
                />
            ))}
            {rest > 0 && (
                <span className="-ml-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-black/60 bg-black/70 px-1 text-[10px] font-medium text-white">
                    +{rest}
                </span>
            )}
        </div>
    );
};

/** Footer meta row shared by video/picture/quote cards. */
export const CardMeta = ({
    user,
    date,
    views,
    rating,
}: {
    user?: User | null;
    date?: string;
    views?: number;
    rating?: number | null;
}) => (
    <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
            <UserChip user={user} />
            {date && <span className="text-[11px] text-faint">{date}</span>}
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
    children,
}: {
    title: string;
    subtitle?: string;
    headerRight?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide md:p-6">
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

export const EmptyState = ({ title, hint }: { title: string; hint?: string }) => (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium text-foreground">{title}</p>
        {hint && <p className="text-sm">{hint}</p>}
    </div>
);
