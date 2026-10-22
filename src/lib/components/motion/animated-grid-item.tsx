"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedGridItemProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}

export function AnimatedGridItem({ children, delay = 0, className }: AnimatedGridItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function AnimatedMasonryItem({ children, delay = 0, className }: AnimatedGridItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.23, 1, 0.32, 1]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function AnimatedSlideUpItem({ children, delay = 0, className }: AnimatedGridItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
