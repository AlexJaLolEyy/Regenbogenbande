import type { Role } from "@/src/generated/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth, Session } from "./auth"

// ============================================
// OWNER DETECTION (application-level logic)
// ============================================
// Owner is determined by env var, not DB role
const OWNER_USER_ID = process.env.OWNER_USER_ID

/**
 * Check if user is the application owner
 */
export function isOwner(userId: string): boolean {
  console.log("OWNER_USER_ID", OWNER_USER_ID);
  console.log("userId", userId);
  console.log("Result:", !!OWNER_USER_ID && userId === OWNER_USER_ID);
  return !!OWNER_USER_ID && userId === OWNER_USER_ID
}

// ============================================
// EFFECTIVE ROLE SYSTEM
// ============================================
// Combines DB role with application-level owner check and guest detection

export type EffectiveRole = "owner" | "admin" | "member" | "guest"

/**
 * Get the effective role for a session
 * - guest: no session or anonymous session
 * - owner: user ID matches OWNER_USER_ID env var
 * - admin/member: from DB role
 */
export function getEffectiveRole(session: Session | null): EffectiveRole {
  // No session or anonymous = guest
  if (!session?.user || session.user.isAnonymous) {
    return "guest"
  }
  // Check owner first (owner supersedes admin)
  if (isOwner(session.user.id)) {
    return "owner"
  }
  // Return DB role (admin or member)
  return (session.user.role as Role) || "member"
}

/**
 * Check if user is a guest (no session or anonymous)
 */
export function isGuest(session: Session | null): boolean {
  return getEffectiveRole(session) === "guest"
}

/**
 * Check if user is authenticated (not a guest)
 */
export function isAuthenticated(session: Session | null): boolean {
  return getEffectiveRole(session) !== "guest"
}

// ============================================
// SESSION UTILITIES
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
// ROLE REQUIREMENT FUNCTIONS
// ============================================

/**
 * Check if user has one of the allowed effective roles
 * Throws error if insufficient permissions
 */
export async function requireEffectiveRole(allowedRoles: EffectiveRole[]): Promise<Session> {
  const session = await requireAuth()
  const effectiveRole = getEffectiveRole(session)

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
  if (!isOwner(session.user.id)) {
    throw new Error("Unauthorized: Owner access required")
  }
  return session
}

/**
 * Require user to be content owner, admin, or app owner
 */
export async function requireContentOwnerOrAdmin(resourceOwnerId: string): Promise<Session> {
  const session = await requireAuth()
  const effectiveRole = getEffectiveRole(session)
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
// PERMISSION HELPERS (pure functions)
// ============================================

/**
 * Check if role allows uploading content
 */
export function canUpload(role: EffectiveRole): boolean {
  return role !== "guest" // owner, admin, member
}

/**
 * Check if role allows editing content
 */
export function canEdit(role: EffectiveRole, isContentOwner: boolean): boolean {
  if (role === "owner" || role === "admin") return true
  if (role === "member" && isContentOwner) return true
  return false
}

/**
 * Check if role allows deleting content
 */
export function canDelete(role: EffectiveRole, isContentOwner: boolean): boolean {
  if (role === "owner" || role === "admin") return true
  if (role === "member" && isContentOwner) return true
  return false
}

/**
 * Check if role allows publishing content (owner only)
 */
export function canPublish(role: EffectiveRole): boolean {
  return role === "owner"
}

/**
 * Check if role allows managing users
 */
export function canManageUsers(role: EffectiveRole): boolean {
  return role === "owner" || role === "admin"
}

/**
 * Check if role allows inviting users
 */
export function canInvite(role: EffectiveRole): boolean {
  return role === "owner" || role === "admin"
}

// ============================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================
// These maintain compatibility with existing code

export const checkAuth = requireAuth
export const checkUploadPermission = requireUploadPermission
export const checkAdmin = requireAdmin
export const checkOwnerOrAdmin = requireContentOwnerOrAdmin
