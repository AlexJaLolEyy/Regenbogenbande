/** Shared motion tokens. Keep animation calm and functional. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
    fast: 0.15,
    base: 0.25,
    slow: 0.5,
} as const;

export const HOVER_LIFT = { y: -2 } as const;

/** Capped stagger so long pages do not feel slow. */
export const staggerDelay = (index: number, step = 0.04, cap = 8) =>
    Math.min(index, cap) * step;
