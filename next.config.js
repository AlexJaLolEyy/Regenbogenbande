/** @type {import('next').NextConfig} */

const nextConfig = {
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.sass', '.json'],
  },
  // Increase body size limit for Server Actions (videos can be large)
  experimental: {
    proxyClientMaxBodySize: '500mb', // Allow up to 500MB for video uploads
  },
  // Configure image domains for R2 storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
      // Also allow specific bucket hostname format (bucket.accountId.r2.cloudflarestorage.com)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;