import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiter
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
    prefix: '@upstash/ratelimit',
});

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
    '/upload(.*)',
    '/settings(.*)',
    '/api/upload(.*)',
    '/api/profile(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    // Protect routes that require authentication
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // Apply rate limiting to API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            return NextResponse.next();
        }

        const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
        const { success, limit, reset, remaining } = await ratelimit.limit(ip);

        if (!success) {
            return NextResponse.json(
                { error: 'Too Many Requests' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': reset.toString(),
                    }
                }
            );
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};

