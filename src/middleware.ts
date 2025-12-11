import NextAuth from "next-auth"
import { authConfig } from "@/src/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnLoginPage = req.nextUrl.pathname.startsWith("/login")
    const isOnAdminPage = req.nextUrl.pathname.startsWith("/admin")

    // Define public routes (assets, api/auth, generic public pages)
    // We already have a specific matcher in config, so here we mostly handle redirects logic.
    // However, the matcher below lets almost everything through to this middleware.

    if (isOnLoginPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/", req.nextUrl))
        }
        // Allow access to login page
        return NextResponse.next()
    }

    // Protect all other routes (invite-only)
    // If not logged in and not on login page (handled above), redirect to login
    if (!isLoggedIn) {
        // If it's a public asset or api route handled by matcher exclusion, this won't run.
        // But for app pages:
        let callbackUrl = req.nextUrl.pathname
        if (req.nextUrl.search) {
            callbackUrl += req.nextUrl.search
        }

        const encodedCallbackUrl = encodeURIComponent(callbackUrl)
        return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.nextUrl))
    }

    // Admin protection
    if (isOnAdminPage) {
        // @ts-expect-error - Custom role property
        const userRole = req.auth?.user?.role
        if (userRole !== "admin") {
            return NextResponse.redirect(new URL("/", req.nextUrl))
        }
    }

    return NextResponse.next()
})

export const config = {
    // Protect everything except public assets and api routes that don't need auth (if any)
    // Exclude: api/auth (handled by auth libraries), _next/static, _next/image, favicon.ico, public images
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon.ico|rainbow.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp).*)",
    ],
}
