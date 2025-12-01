import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize the rate limiter
// We use a sliding window of 10 requests per 10 seconds
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
    prefix: '@upstash/ratelimit',
});

export const config = {
    matcher: '/api/:path*',
};

export default async function middleware(request: NextRequest) {
    // Skip rate limiting if no keys are present (e.g. during build or local dev without keys)
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return NextResponse.next();
    }

    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

    const { success, pending, limit, reset, remaining } = await ratelimit.limit(
        ip
    );

    // Return the response immediately
    // pending is a promise that resolves when the analytics are submitted
    // We don't wait for it to resolve to keep latency low
    // context.waitUntil(pending); // If using Vercel Edge, we can use this. For now, we just let it float.

    const res = success
        ? NextResponse.next()
        : NextResponse.json(
            { error: 'Too Many Requests' },
            { status: 429 }
        );

    res.headers.set('X-RateLimit-Limit', limit.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', reset.toString());

    return res;
}
