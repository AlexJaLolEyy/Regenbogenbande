// SSRF-safe fetch helper: https only, host allowlist, validated redirects, size cap.

const ALLOWED_HOST_SUFFIXES = ["medal.tv"]
const MAX_REDIRECTS = 3

export const MAX_VIDEO_BYTES = 500 * 1024 * 1024
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
export const MAX_HTML_BYTES = 2 * 1024 * 1024

export function assertAllowedUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error("Invalid URL")
  }
  if (url.protocol !== "https:") throw new Error("Only https URLs are allowed")
  if (url.username || url.password) throw new Error("URL credentials are not allowed")
  const host = url.hostname.toLowerCase()
  const ok = ALLOWED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`))
  if (!ok) throw new Error("Host not allowed")
  return url
}

/** fetch() that re-validates every redirect hop against the allowlist. */
export async function safeFetch(raw: string, init: RequestInit = {}): Promise<Response> {
  let current = assertAllowedUrl(raw)
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(current, { ...init, redirect: "manual" })
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location")
      if (!location) throw new Error("Redirect without location")
      current = assertAllowedUrl(new URL(location, current).toString())
      continue
    }
    return res
  }
  throw new Error("Too many redirects")
}

/** Reads a response body, aborting once it exceeds maxBytes. */
export async function readLimited(res: Response, maxBytes: number): Promise<Buffer> {
  const declared = Number(res.headers.get("content-length"))
  if (declared && declared > maxBytes) throw new Error("Response too large")
  if (!res.body) return Buffer.alloc(0)

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new Error("Response too large")
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}
