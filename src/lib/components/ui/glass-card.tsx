import { cn } from "@/src/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    /** "default" = card surface, "elevated" = modal/popover level, "interactive" = clickable card */
    variant?: "default" | "elevated" | "interactive";
    /** Raise elevation + border on hover (no colored glow). */
    hoverEffect?: boolean;
}

/**
 * Token-based subtle glass. Depth comes from a 1px border, soft shadow and
 * small blur — never heavy blur or colored glow.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, children, variant = "default", hoverEffect = true, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-2xl border border-border text-card-foreground backdrop-blur-md shadow-sm transition-all duration-200",
                    variant === "elevated" ? "bg-elevated/90" : "bg-card/70",
                    variant === "interactive" && "cursor-pointer",
                    (hoverEffect || variant === "interactive") &&
                        "hover:bg-card/90 hover:border-foreground/20 hover:shadow-md",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

GlassCard.displayName = "GlassCard";
