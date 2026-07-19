/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@/packages/ui"],
  outputFileTracingIncludes: {
    "**/*": [
      "./node_modules/pg/lib/*.js",
      "./node_modules/pg/node_modules/**/*",
    ],
  },
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
