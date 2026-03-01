/**
 * In-memory rate limiter for Next.js API routes.
 * Uses a sliding-window counter pattern with automatic cleanup.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60 seconds
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (now > entry.resetAt) store.delete(key);
        }
    }, 60_000);
}

interface RateLimitConfig {
    /** Max requests allowed in the time window */
    maxRequests: number;
    /** Window size in seconds */
    windowSeconds: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
    auth: { maxRequests: 10, windowSeconds: 60 },
    api: { maxRequests: 60, windowSeconds: 60 },
    payment: { maxRequests: 5, windowSeconds: 60 },
};

/**
 * Check if a request should be rate-limited.
 * @returns null if allowed, or an object with retry-after info if blocked.
 */
export function checkRateLimit(
    identifier: string,
    type: 'auth' | 'api' | 'payment' = 'api'
): { limited: false } | { limited: true; retryAfterSeconds: number } {
    const config = DEFAULTS[type];
    const key = `${type}:${identifier}`;
    const now = Date.now();

    const existing = store.get(key);

    if (!existing || now > existing.resetAt) {
        // Start new window
        store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
        return { limited: false };
    }

    if (existing.count >= config.maxRequests) {
        const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
        return { limited: true, retryAfterSeconds };
    }

    existing.count++;
    return { limited: false };
}

/**
 * Extract client IP from Next.js request for rate limiting.
 */
export function getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const real = req.headers.get('x-real-ip');
    if (real) return real;
    return 'unknown';
}
