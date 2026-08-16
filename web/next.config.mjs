/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@/packages/ui"],
	distDir: process.env.NEXT_DIST_DIR || ".next",
	turbopack: {
		root: process.cwd(),
	},
	serverExternalPackages: ["@libsql/client"],
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
