/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@/packages/ui"],
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
