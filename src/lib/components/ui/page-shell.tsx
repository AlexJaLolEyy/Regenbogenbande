"use client";

import { cn } from "@/src/lib/utils";
import React from "react";

interface PageShellProps {
    children: React.ReactNode;
    /** "default" = fixed-height shell (lists manage their own scroll); "scroll" = normal page flow for detail and form pages. */
    variant?: "default" | "scroll";
    className?: string;
}

export const PageShell = ({ children, variant = "default", className }: PageShellProps) => {
    if (variant === "scroll") {
        return (
            <div className={cn("relative min-h-[calc(100vh-3rem)] w-full bg-background text-foreground", className)}>
                {children}
            </div>
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
