import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	const baseUrl = "https://www.secureit.co";

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/", "/admin/", "/my-account/"],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
