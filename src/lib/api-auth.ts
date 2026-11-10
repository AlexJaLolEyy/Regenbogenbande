import { NextResponse } from "next/server"
import type { Session } from "./auth"
import { getEffectiveRole, getSession } from "./auth-utils"

type GuardResult =
  | { session: Session; response?: undefined }
  | { session?: undefined; response: NextResponse }

/**
 * Route-handler guard: returns a 401/403 JSON response instead of redirecting.
 * Usage:
 *   const guard = await guardApi("member")
 *   if (guard.response) return guard.response
 */
export async function guardApi(minimum: "member" | "admin" = "member"): Promise<GuardResult> {
  const session = await getSession()
  if (!session?.user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const role = getEffectiveRole(session)
  const allowed = minimum === "admin" ? ["admin", "owner"] : ["member", "admin", "owner"]
  if (!allowed.includes(role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { session }
}
