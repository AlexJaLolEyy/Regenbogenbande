import { cn } from "@/src/lib/utils";
import type { Category } from "../../types/types";

/** Small pill: category icon (14px) + name, with a letter tile as fallback. */
export function CategoryBadge({
    category,
    className,
    overlay = false,
}: {
    category?: Pick<Category, "name" | "iconUrl"> | null;
    className?: string;
    /** Use the dark glass style when sitting on top of media. */
    overlay?: boolean;
}) {
    if (!category) return null;
    return (
        <span
            className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium",
                overlay
                    ? "border-white/10 bg-black/60 text-white backdrop-blur-md"
                    : "border-border bg-muted text-muted-foreground",
                className
            )}
        >
            {category.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={category.iconUrl} alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0 rounded-sm object-cover" />
            ) : (
                <span
                    aria-hidden
                    className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm text-[9px] font-semibold uppercase",
                        overlay ? "bg-white/15" : "bg-foreground/10"
                    )}
                >
                    {category.name?.[0] ?? "?"}
                </span>
            )}
            <span className="truncate">{category.name}</span>
        </span>
    );
}
