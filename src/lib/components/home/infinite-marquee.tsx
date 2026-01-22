"use client";
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';
import React from 'react';

interface MarqueeProps {
    className?: string;
    reverse?: boolean;
    pauseOnHover?: boolean;
    children?: React.ReactNode;
    vertical?: boolean;
    repeat?: number;
    [key: string]: any;
}

export default function InfiniteMarquee({
    className,
    reverse,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
    ...props
}: MarqueeProps) {
    return (
        <div
            {...props}
            className={cn(
                "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
                {
                    "flex-row": !vertical,
                    "flex-col": vertical,
                },
                className
            )}
        >
            {Array(repeat)
                .fill(0)
                .map((_, i) => (
                    <motion.div
                        key={i}
                        className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
                            "animate-marquee flex-row": !vertical,
                            "animate-marquee-vertical flex-col": vertical,
                            "group-hover:[animation-play-state:paused]": pauseOnHover,
                            "[animation-direction:reverse]": reverse,
                        })}
                        initial={{ x: 0 }}
                        animate={{ x: "-100%" }}
                        transition={{
                            duration: 20, // Adjust speed via prop if needed, currently hardcoded for smooth consistency
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    // Overwrite motion for CSS animation approach if preferred, but using CSS class for performance usually better
                    // Actually, for "Project Lava" smooth marquee, let's use the Tailwind CSS animation approach for better performance than JS motion
                    >
                        {/* We will rely on Tailwind classes for the animation to save JS thread */}
                        {children}
                    </motion.div>
                ))}
        </div>
    );
}
// Note: We need to add 'marquee' animation to globals.css if not present.
// Or we can use framer motion strictly. Let's use Framer Motion correctly to ensure no config hacks needed.

export function Marquee({
    className,
    reverse,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
    duration = 20,
}: MarqueeProps) {
    return (
        <div className={cn("flex overflow-hidden gap-4 select-none", className)}>
            {Array(repeat).fill(0).map((_, i) => (
                <motion.div
                    key={i}
                    className="flex shrink-0 items-center justify-around gap-4 min-w-full"
                    initial={{ x: reverse ? "-100%" : "0%" }}
                    animate={{ x: reverse ? "0%" : "-100%" }}
                    transition={{
                        duration: duration,
                        ease: "linear",
                        repeat: Infinity
                    }}
                >
                    {children}
                </motion.div>
            ))}
        </div>
    )
}
