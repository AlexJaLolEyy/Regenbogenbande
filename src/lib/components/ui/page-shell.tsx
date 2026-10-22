"use client";

import { cn } from "@/src/lib/utils";
import React from "react";
import { AuroraBackground } from "../home/aurora-background";

interface PageShellProps {
    children: React.ReactNode;
    /** "default" = neutral tokened background; "aurora" = decorative (marketing only). */
    variant?: "default" | "aurora";
    className?: string;
}

export const PageShell = ({ children, variant = "default", className }: PageShellProps) => {
    if (variant === "aurora") {
        return (
            <AuroraBackground className={cn("min-h-screen", className)}>
                <div className="relative z-10 w-full h-full">
                    {children}
                </div>
            </AuroraBackground>
        );
    }

    return (
        <div className={cn(
            "h-screen w-full relative flex flex-col overflow-hidden",
            "bg-background text-foreground",
            className
        )}>
            <div className="relative z-10 flex-1 w-full h-full">
                {children}
            </div>
        </div>
    );
};
