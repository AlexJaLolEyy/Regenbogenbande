import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/admin")
            if (isOnDashboard) {
                // @ts-expect-error - Custom role property
                if (isLoggedIn && auth?.user?.role !== "admin") return false
                return isLoggedIn
            }
            return true
        },
        jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
            }
            return token
        },
        session({ session, token }) {
            if (session.user) {
                // @ts-expect-error - Custom session properties
                session.user.id = token.id as string
                // @ts-expect-error - Custom session properties
                session.user.role = token.role as string
            }
            return session
        },
    },
    providers: [], // Add providers with an empty array for now
    secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig
