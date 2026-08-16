import { describe, expect, it } from "vitest";
import { normalizeTursoUrl } from "@/lib/turso";

describe("lib/turso normalizeTursoUrl", () => {
	it("converts turso:// to libsql://", () => {
		expect(normalizeTursoUrl("turso://secureit.turso.io")).toBe(
			"libsql://secureit.turso.io",
		);
	});

	it("leaves libsql:// URLs untouched", () => {
		expect(normalizeTursoUrl("libsql://secureit.turso.io")).toBe(
			"libsql://secureit.turso.io",
		);
	});

	it("leaves file: URLs untouched", () => {
		expect(normalizeTursoUrl("file:local.db")).toBe("file:local.db");
	});

	it("handles empty strings", () => {
		expect(normalizeTursoUrl("")).toBe("");
	});
});
