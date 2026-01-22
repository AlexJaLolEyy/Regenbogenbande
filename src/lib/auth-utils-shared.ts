import type { Role } from "@/src/generated/prisma";

// Generic session interface that works for both server and client sessions
interface SessionLike {
  user?: {
    id: string;
    role?: string | null;
    isAnonymous?: boolean | null;
  } | null;
}

// ============================================
// OWNER DETECTION (application-level logic)
// ============================================
// Owner is determined by env var, not DB role
// Note: On client-side, process.env.OWNER_USER_ID will be undefined unless prefixed with NEXT_PUBLIC_
const OWNER_USER_ID = process.env.OWNER_USER_ID

/**
 * Check if user is the application owner
 */
export function isOwner(userId: string): boolean {
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
export function getEffectiveRole(session: SessionLike | null): EffectiveRole {
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
export function isGuest(session: SessionLike | null): boolean {
  return getEffectiveRole(session) === "guest"
}

/**
 * Check if user is authenticated (not a guest)
 */
export function isAuthenticated(session: SessionLike | null): boolean {
  return getEffectiveRole(session) !== "guest"
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
