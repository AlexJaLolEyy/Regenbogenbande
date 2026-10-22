"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAccent } from "./use-accent";

export interface ChartColors {
    accent: string;
    success: string;
    warning: string;
    muted: string;
    grid: string;
    tick: string;
}

const FALLBACK: ChartColors = {
    accent: "#98A1B2",
    success: "#4E9A73",
    warning: "#D09A4C",
    muted: "#98A1B2",
    grid: "#2A303D",
    tick: "#98A1B2",
};

/**
 * Chart.js cannot read CSS variables, so resolve the design tokens to
 * concrete colors. Re-resolves when the theme changes.
 */
export function useChartColors(): ChartColors {
    const { resolvedTheme } = useTheme();
    const { accent } = useAccent();
    const [colors, setColors] = useState<ChartColors>(FALLBACK);

    useEffect(() => {
        // Wait a frame so the theme class is applied before reading variables.
        const id = requestAnimationFrame(() => {
            const style = getComputedStyle(document.documentElement);
            const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
            setColors({
                accent: read("--theme-accent", FALLBACK.accent),
                success: read("--chart-2", FALLBACK.success),
                warning: read("--chart-3", FALLBACK.warning),
                muted: read("--chart-4", FALLBACK.muted),
                grid: read("--border", FALLBACK.grid),
                tick: read("--muted-foreground", FALLBACK.tick),
            });
        });
        return () => cancelAnimationFrame(id);
    }, [resolvedTheme, accent]);

    return colors;
}
