import { cn } from "@/src/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import React from "react";

interface StatTileProps {
    label: string;
    value: React.ReactNode;
    /** Small secondary line, e.g. "12 videos · 3 pictures". */
    hint?: React.ReactNode;
    /** Percentage change versus the previous period. null/undefined hides it. */
    delta?: number | null;
    /** CSS color for the value (token, e.g. "var(--chart-2)"). */
    color?: string;
    /** Icon shown in an accent-tinted chip. */
    icon?: LucideIcon;
    className?: string;
}

export const StatTile = ({ label, value, hint, delta, color, icon: Icon, className }: StatTileProps) => (
    <div className={cn("flex flex-col rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-md", className)}>
        <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-faint">{label}</p>
            {Icon && (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-theme-accent">
                    <Icon size={14} />
                </span>
            )}
        </div>
        <p className="font-mono text-3xl font-semibold tracking-tight" style={color ? { color } : undefined}>
            {value}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {delta != null && (
                <span
                    className={cn(
                        "inline-flex items-center gap-0.5 font-medium",
                        delta >= 0 ? "text-success" : "text-danger"
                    )}
                >
                    {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(delta).toFixed(0)}%
                </span>
            )}
            {hint && <span>{hint}</span>}
        </div>
    </div>
);
