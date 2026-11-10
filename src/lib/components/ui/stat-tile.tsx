import { cn } from "@/src/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
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
    className?: string;
}

export const StatTile = ({ label, value, hint, delta, color, className }: StatTileProps) => (
    <div className={cn("flex flex-col rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-md", className)}>
        <p className="mb-2 text-xs text-faint">{label}</p>
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
