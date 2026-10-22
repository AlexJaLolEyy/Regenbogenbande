import { cn } from "@/src/lib/utils";
import React from "react";
import { GlassCard } from "../ui/glass-card";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <GlassCard
            className={cn(
                "row-span-1 group/bento p-4 justify-between flex flex-col space-y-4",
                className
            )}
        >
            {header}
            <div>
                {icon}
                <div className="font-semibold text-foreground mb-1 mt-2">
                    {title}
                </div>
                <div className="text-sm text-muted-foreground">
                    {description}
                </div>
            </div>
        </GlassCard>
    );
};
