import { cn } from "@/src/lib/utils";
import { Star } from "lucide-react";

/** Compact rating display. The only place the gold token is used for list/meta ratings. */
export function Rating({ value, className }: { value?: number | null; className?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-gold", className)}>
            <Star size={12} fill="currentColor" />
            {value ? value.toFixed(1) : "0.0"}
        </span>
    );
}
