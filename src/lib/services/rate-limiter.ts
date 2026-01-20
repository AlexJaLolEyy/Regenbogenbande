/**
 * Simple in-memory rate limiter for view counting.
 * 
 * LIMITATIONS:
 * - Not distributed: Each serverless function instance has its own cache
 * - Cache resets on cold starts
 * 
 * For production-scale apps, use Redis/Upstash KV instead.
 */

const viewCache = new Map<string, number>();
const DEFAULT_COOLDOWN_MS = 60 * 1000; // 60 seconds

export interface RateLimitResult {
    allowed: boolean;
    reason?: 'cooldown' | 'first-view';
}

export function checkViewRateLimit(
    cacheKey: string,
    cooldownMs: number = DEFAULT_COOLDOWN_MS
): RateLimitResult {
    const now = Date.now();
    const lastView = viewCache.get(cacheKey);

    if (!lastView) {
        viewCache.set(cacheKey, now);
        return { allowed: true, reason: 'first-view' };
    }

    if (now - lastView > cooldownMs) {
        viewCache.set(cacheKey, now);
        return { allowed: true };
    }

    return { allowed: false, reason: 'cooldown' };
}

export function buildViewCacheKey(
    contentType: 'video' | 'picture' | 'quote',
    contentId: string,
    identifier: string // userId or IP
): string {
    return `${contentType}_${identifier}_${contentId}`;
}
