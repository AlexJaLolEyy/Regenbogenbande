"use client";

import { cn } from "@/src/lib/utils";
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { formatDate, relativeDate } from "@/src/lib/utils/format";
import { addToast, AvatarGroup, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Tooltip } from "@heroui/react";
import { ArrowLeft, Eye, MoreVertical, Pencil, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { CategoryBadge } from "../ui/category-badge";
import type { Category, User } from "../../types/types";
import { DeleteButton } from "../ui/delete-button";
import { PageShell } from "../ui/page-shell";

const BACK_LABELS: Record<string, string> = {
    "/videos": "Back to Videos",
    "/pictures": "Back to Pictures",
    "/quotes": "Back to Quotes",
};

/** Page wrapper shared by all three detail views. Esc goes back to the list. */
export const ViewPage = ({ backHref, children }: { backHref: string; children: React.ReactNode }) => {
    const router = useRouter();
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape" || e.defaultPrevented) return;
            const el = e.target as HTMLElement | null;
            if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
            // Let open dialogs / menus handle Esc themselves.
            if (document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) return;
            router.push(backHref);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [router, backHref]);

    return (
        <PageShell variant="scroll">
            <div className="w-full px-4 pb-8 pt-6 md:px-8">
                <div className="mx-auto max-w-450">
                    <Link
                        href={backHref}
                        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 outline-theme-accent"
                    >
                        <ArrowLeft size={16} />
                        {BACK_LABELS[backHref] ?? "Back"}
                        <kbd className="ml-1 hidden rounded border border-border px-1 text-[11px] text-faint md:inline">Esc</kbd>
                    </Link>
                    <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-4">{children}</div>
                </div>
            </div>
        </PageShell>
    );
};

/** Media/stage surface (player, image, chat). */
export const Stage = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div
        className={cn(
            "group relative w-full overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-sm",
            className
        )}
    >
        {children}
    </div>
);

/** Titled surface used for description, participants, details. */
export const InfoCard = ({
    title,
    className,
    children,
}: {
    title: string;
    className?: string;
    children: React.ReactNode;
}) => (
    <section className={cn("rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-md", className)}>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">{title}</h3>
        {children}
    </section>
);

export const Participants = ({ participants }: { participants: User[] }) =>
    participants.length === 0 ? (
        <p className="text-sm text-faint">No participants</p>
    ) : (
        <AvatarGroup max={6} size="sm" isGrid className="justify-start">
            {participants.map((p) => (
                <Tooltip key={p.id} content={p.username}>
                    <UserAvatar src={p.profilePicture || undefined} name={p.username} className="border-2 border-border" />
                </Tooltip>
            ))}
        </AvatarGroup>
    );

/** Rate / Share / (Edit, Delete) bar. Identical for video, picture and quote. */
export const ActionBar = ({
    type,
    id,
    ownerId,
    onRate,
    className,
}: {
    type: "video" | "picture" | "quote";
    id: string;
    ownerId: string;
    onRate: () => void;
    className?: string;
}) => {
    const handleShare = async () => {
        await navigator.clipboard.writeText(window.location.href);
        addToast({ title: "Link copied", color: "success" });
    };
    const plural = `${type}s`;
    const label = type.charAt(0).toUpperCase() + type.slice(1);

    return (
        <div className={cn("flex shrink-0 items-center gap-1 rounded-xl border border-border bg-card/70 p-1", className)}>
            <Button
                size="sm"
                variant="light"
                className="rounded-lg px-3 font-medium"
                startContent={<Star size={16} className="text-gold" />}
                onPress={onRate}
            >
                Rate
            </Button>
            <Button
                size="sm"
                variant="light"
                className="rounded-lg px-3 font-medium"
                startContent={<Share2 size={16} />}
                onPress={handleShare}
            >
                Share
            </Button>
            <Dropdown placement="bottom-end">
                <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light" className="rounded-lg text-muted-foreground" aria-label="More actions">
                        <MoreVertical size={16} />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Actions" className="p-2">
                    <DropdownItem key="edit" href={`/${plural}/${id}/edit`} as={Link} startContent={<Pencil size={14} />}>
                        Edit {label}
                    </DropdownItem>
                    <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        variant="flat"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <DeleteButton id={id} type={type} ownerId={ownerId} redirectUrl={`/${plural}`} />
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};

/** Uploader, category and date, plus view/rating stats. */
export const MetaRow = ({
    uploader,
    category,
    date,
    views,
    rating,
}: {
    uploader: User;
    category?: Category | null;
    date: Date;
    views: number;
    rating?: number;
}) => (
    <div className="flex flex-col items-start justify-between gap-6 border-t border-divider pt-6 md:flex-row md:items-end">
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
                <UserAvatar src={uploader.profilePicture || undefined} name={uploader.username?.[0]} size="md" className="border border-border" />
                <span className="text-base font-medium text-foreground">{uploader.username}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {category?.name && <CategoryBadge category={category} />}
                <span className="rounded-lg border border-border px-2.5 py-1" title={formatDate(date)}>{relativeDate(date)}</span>
            </div>
        </div>

        <div className="flex shrink-0 items-center gap-8">
            <Stat label="Views" icon={<Eye size={14} className="text-faint" />} value={views.toLocaleString()} />
            <div className="h-8 w-px bg-border" />
            <Stat
                label="Rating"
                icon={<Star size={14} className="text-gold" fill="currentColor" />}
                value={rating ? rating.toFixed(1) : "0.0"}
                valueClassName="text-gold"
            />
        </div>
    </div>
);

export const Stat = ({
    label,
    value,
    icon,
    valueClassName,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    valueClassName?: string;
}) => (
    <div className="flex flex-col items-end">
        <span className="mb-1 text-xs text-faint">{label}</span>
        <div className={cn("flex items-center gap-2 font-mono text-xl font-semibold text-foreground", valueClassName)}>
            {icon}
            {value}
        </div>
    </div>
);

/** Title + action bar header row. */
export const TitleRow = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">{title}</h1>
        {children}
    </div>
);
