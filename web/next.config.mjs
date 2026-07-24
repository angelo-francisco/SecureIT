/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@/packages/ui"],
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
