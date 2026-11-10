/** @type {import('next').NextConfig} */

// Only allow images from the configured R2 public URL (plus *.r2.dev as a fallback for dev buckets)
function r2Patterns() {
  const patterns = [{ protocol: 'https', hostname: '*.r2.dev', pathname: '/**' }];
  try {
    const { hostname } = new URL(process.env.R2_PUBLIC_URL || '');
    if (hostname && !hostname.endsWith('.r2.dev')) {
      patterns.push({ protocol: 'https', hostname, pathname: '/**' });
    }
  } catch {}
  return patterns;
}

const nextConfig = {
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.json'],
  },
  // Increase body size limit for Server Actions (videos can be large)
  experimental: {
    proxyClientMaxBodySize: '500mb', // Allow up to 500MB for video uploads
  },
  // Configure image domains for R2 storage
  images: {
    remotePatterns: [
      // Our own public R2 bucket (custom domain or *.r2.dev), taken from R2_PUBLIC_URL
      ...r2Patterns(),
      { protocol: 'https', hostname: 'api.dicebear.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.discordapp.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.medal.tv', pathname: '/**' },
    ],
  },  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Only framing is restricted here. A full script/style CSP needs testing
          // against HeroUI/Next inline scripts first, so it is not enforced yet.
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;