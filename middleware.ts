import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/budget(.*)',
  '/tasks(.*)',
  '/team(.*)',
  '/contacts(.*)',
  '/docs(.*)',
  '/account(.*)',
  '/projects(.*)', // Assuming a /projects/new route etc.
  '/pro(.*)',      // Protect pro status/checkout pages (except maybe cancel?)
]);

// Define routes accessible to all users (public)
const isPublicRoute = createRouteMatcher([
    '/', // Landing page
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/stripe(.*)', // Stripe webhook needs to be public
    '/api/checkout(.*)', // Checkout API might need careful handling (auth check within)
    '/help(.*)', // Public help page
    // Add other public routes like /pricing, /about, etc.
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, sessionClaims, getToken } = auth();

  // If the route is public, allow access
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // If the route is protected and user is not logged in, redirect to sign-in
  if (isProtectedRoute(req) && !userId) {
    console.log(`Protected route access denied (no userId): ${req.nextUrl.pathname}`);
    // Construct redirect URL, preserving search params if needed
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname); // Optional: Redirect back after login
    return NextResponse.redirect(signInUrl);
  }

    // If user is logged in (userId exists) and accessing a protected route, allow access
    if (isProtectedRoute(req) && userId) {
        // Optional: Add role/permission checks here if needed using sessionClaims or orgId
        // Example: Check for admin role
        // const isAdmin = sessionClaims?.metadata?.role === 'admin';
        // if (req.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
        //   return NextResponse.redirect(new URL('/unauthorized', req.url));
        // }

        // Optional: Trigger DB user sync here if webhook is unreliable (use with caution)
        // try {
        //     // Fetch token to pass to server-side function if needed
        //     // const token = await getToken({ template: 'supabase' }); // Example for Supabase JWT
        //     // await fetch(new URL('/api/sync-user', req.url), { method: 'POST' });
        // } catch (error) {
        //     console.error("Middleware user sync failed:", error);
        // }

        return NextResponse.next();
    }


  // Fallback: If route doesn't match public or protected (and user may or may not be logged in),
  // decide default behavior. Often, it's safe to allow access or redirect to a default page.
  // Let's assume non-matched routes are implicitly public or handled by Next.js routing.
  return NextResponse.next();

}, { debug: process.env.NODE_ENV === 'development' }); // Enable debug logging in dev

export const config = {
  // Matcher specifies which routes the middleware runs on
  // It's generally recommended to run middleware on most routes and use logic inside
  // to differentiate public/protected, rather than trying to exclude everything.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/trpc (if using tRPC) - adjust if needed
     */
    '/((?!_next/static|_next/image|favicon.ico|api/trpc).*)',
    '/', // Ensure root is matched
    '/(api|trpc)(.*)', // Include API routes for potential auth checks within them
    ],
};
