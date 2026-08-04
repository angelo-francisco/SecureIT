/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@/packages/ui"],
	serverExternalPackages: ["@libsql/client"],
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
