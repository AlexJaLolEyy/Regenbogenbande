// Minimal runtime env validation (no extra dependency).
// Called once at server boot from src/instrumentation.ts.

const REQUIRED = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
] as const

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim())
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. See .env.example.`
    )
  }

  if (process.env.BETTER_AUTH_SECRET!.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters.')
  }

  try {
    new URL(process.env.R2_PUBLIC_URL!)
  } catch {
    throw new Error('R2_PUBLIC_URL must be a valid URL.')
  }

  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL!.includes(':5432')) {
    console.warn(
      '[env] DATABASE_URL uses port 5432. On Vercel use the Supabase transaction pooler (port 6543) and keep DIRECT_URL for migrations.'
    )
  }
}
