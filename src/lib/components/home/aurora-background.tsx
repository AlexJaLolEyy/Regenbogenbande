"use client";
import { cn } from "@/src/lib/utils";
import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
    children?: ReactNode;
    showRadialGradient?: boolean;
}

export const AuroraBackground = ({
    className,
    children,
    showRadialGradient = true,
    ...props
}: AuroraBackgroundProps) => {
    return (
        <div
            className={cn(
                "relative flex flex-col h-screen items-center justify-center bg-zinc-950 text-slate-950 transition-bg overflow-hidden",
                className
            )}
            {...props}
        >
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className={cn(
                        // Bubbles
                        `
            absolute top-0 left-0 w-full h-full opacity-40 blur-[80px]
            bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))]
            from-purple-900 via-zinc-950 to-zinc-950
            `
                    )}
                />
                {/* Moving Blobs */}
                <motion.div
                    animate={{
                        x: [-100, 100, -100],
                        y: [-50, 50, -50],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute -top-[10%] -left-[10%] w-[50vh] h-[50vh] bg-purple-600/30 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        x: [100, -100, 100],
                        y: [50, -50, 50],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-[20%] right-[10%] w-[60vh] h-[60vh] bg-blue-600/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        x: [-50, 50, -50],
                        y: [100, -100, 100],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-[10%] left-[20%] w-[40vh] h-[40vh] bg-pink-600/20 rounded-full blur-[100px]"
                />
            </div>

            {/* Content wrapper with z-index */}
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
};
