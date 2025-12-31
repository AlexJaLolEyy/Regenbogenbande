import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    const publicPaths = [
        "/login",
        "/api/auth",
        "/_next",
        "/favicon.ico",
        "/rainbow.svg",
        "/uploads",
    ]

    // Check if the path is public
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // Allow public assets
    const isAsset = /\.(png|jpg|jpeg|gif|webp|svg|ico|mp4|webm)$/i.test(pathname)

    if (isPublicPath || isAsset) {
        return NextResponse.next()
    }

    // Check for session cookie (better-auth uses this)
    const sessionToken = request.cookies.get("better-auth.session_token")?.value

    // If on login page and has session, redirect to home
    if (pathname === "/login" && sessionToken) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    // For protected routes, we allow through but let server components handle auth
    // This is because better-auth sessions need to be verified server-side
    // The actual authorization is handled by auth-utils.ts functions (requireAuth, etc.)
    // 
    // Note: We don't redirect to /login here because:
    // 1. Anonymous guests should be able to browse (read-only)
    // 2. Server components will redirect to login if authentication is required
    return NextResponse.next()
}

export const config = {
    matcher: [
        // Match all paths except static files
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
}
