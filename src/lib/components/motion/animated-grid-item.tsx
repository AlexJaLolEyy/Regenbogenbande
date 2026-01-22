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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
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
