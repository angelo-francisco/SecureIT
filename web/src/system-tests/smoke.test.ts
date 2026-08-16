import { describe, expect, it } from "vitest";
import { ApiClient } from "./utils/client";
import { systemConfig } from "./utils/context";

describe("system harness smoke", () => {
	it("serves public API over real HTTP", async () => {
		const client = new ApiClient();
		const res = await client.get<{ error?: string }>("/api/plans");
		expect(res.status).toBe(200);
		expect(Array.isArray(res.json)).toBe(true);
	});

	it("exposes the isolated database file", () => {
		expect(systemConfig.dbFile).toContain("secureit-system-");
	});

	it("redirects unauthenticated /my-account to login", async () => {
		const client = new ApiClient();
		const res = await client.request<unknown>("/my-account", {
			method: "GET",
			headers: { Accept: "text/html" },
		});
		expect([302, 307]).toContain(res.status);
		const location = res.headers.get("location") ?? "";
		expect(location).toContain("/login");
	});
});
