/** @type {import('next').NextConfig} */

const nextConfig = {
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.sass', '.json'],
  },
};

export default nextConfig;