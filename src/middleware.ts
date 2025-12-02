import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

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

// Routes that don't need onboarding check
const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/onboarding(.*)',
    '/api/webhooks(.*)',
    '/',
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // Protect routes that require authentication
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // Check if user has completed onboarding (only for authenticated users on protected routes)
    if (userId && isProtectedRoute(req) && !isPublicRoute(req)) {
        try {
            // Create Supabase client
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Check if user profile exists
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();

            // If no profile exists, redirect to onboarding
            if (!profile && !error) {
                const onboardingUrl = new URL('/onboarding', req.url);
                return NextResponse.redirect(onboardingUrl);
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            // On error, continue to allow access (fail open)
        }
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

