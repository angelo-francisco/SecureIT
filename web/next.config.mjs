/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@/packages/ui"],
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
