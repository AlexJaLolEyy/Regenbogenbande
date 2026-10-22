import type { Role } from "@/src/generated/prisma";

// Generic session interface that works for both server and client sessions
interface SessionLike {
  user?: {
    id: string;
    role?: string | null;
    isAnonymous?: boolean | null;
  } | null;
}

export type EffectiveRole = "owner" | "admin" | "member" | "guest"

/**
 * Get the effective role for a session
 * - guest: no session or anonymous session
 * - owner, admin, member: from DB role
 */
export function getEffectiveRole(session: SessionLike | null): EffectiveRole {
  // No session or anonymous = guest
  if (!session?.user || session.user.isAnonymous) {
    return "guest"
  }

  // Return DB role (owner, admin, or member)
  return (session.user.role as EffectiveRole) || "member"
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
