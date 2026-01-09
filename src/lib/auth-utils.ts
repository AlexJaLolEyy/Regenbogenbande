import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth, Session } from "./auth"
import * as shared from "./auth-utils-shared"

// Re-export everything from shared
export * from "./auth-utils-shared"

// ============================================
// SESSION UTILITIES (Server-only)
// ============================================

/**
 * Get the current session (server-side)
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}

// ============================================
// ROLE REQUIREMENT FUNCTIONS (Server-only)
// ============================================

/**
 * Check if user has one of the allowed effective roles
 * Throws error if insufficient permissions
 */
export async function requireEffectiveRole(allowedRoles: shared.EffectiveRole[]): Promise<Session> {
  const session = await requireAuth()
  const effectiveRole = shared.getEffectiveRole(session)

  if (!allowedRoles.includes(effectiveRole)) {
    throw new Error("Unauthorized: Insufficient permissions")
  }
  return session
}

/**
 * Require upload permission (member, admin, or owner)
 */
export async function requireUploadPermission(): Promise<Session> {
  return requireEffectiveRole(["member", "admin", "owner"])
}

/**
 * Require admin or owner role
 */
export async function requireAdmin(): Promise<Session> {
  return requireEffectiveRole(["admin", "owner"])
}

/**
 * Require owner role (for publishing)
 */
export async function requireOwner(): Promise<Session> {
  const session = await requireAuth()
  if (!shared.isOwner(session.user.id)) {
    throw new Error("Unauthorized: Owner access required")
  }
  return session
}

/**
 * Require user to be content owner, admin, or app owner
 */
export async function requireContentOwnerOrAdmin(resourceOwnerId: string): Promise<Session> {
  const session = await requireAuth()
  const effectiveRole = shared.getEffectiveRole(session)
  const userId = session.user.id

  // Owner and admin can edit anything
  if (effectiveRole === "owner" || effectiveRole === "admin") {
    return session
  }

  // Member can edit own content
  if (userId === resourceOwnerId) {
    return session
  }

  throw new Error("Unauthorized: You do not have permission to modify this resource")
}

// ============================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================
// These maintain compatibility with existing code

export const checkAuth = requireAuth
export const checkUploadPermission = requireUploadPermission
export const checkAdmin = requireAdmin
export const checkOwnerOrAdmin = requireContentOwnerOrAdmin
