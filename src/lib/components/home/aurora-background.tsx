"use client";
import { cn } from "@/src/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
    children?: ReactNode;
    showRadialGradient?: boolean;
}

/**
 * Calm page backdrop: tokened background plus one very faint, static wash.
 * (Name kept for existing imports; the animated orbs were removed.)
 */
export const AuroraBackground = ({
    className,
    children,
    showRadialGradient = true,
    ...props
}: AuroraBackgroundProps) => {
    return (
        <div
            className={cn(
                "relative flex flex-col min-h-screen bg-background text-foreground transition-colors",
                className
            )}
            {...props}
        >
            <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
                {showRadialGradient && (
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in srgb, var(--foreground) 6%, transparent), transparent 70%)",
                        }}
                    />
                )}
            </div>

            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
};
