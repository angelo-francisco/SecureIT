import { hashSync } from "bcryptjs";
import Database from "better-sqlite3";
import { systemConfig } from "./context";

let _db: Database.Database | undefined;

export function testDb(): Database.Database {
	if (!_db) {
		_db = new Database(systemConfig.dbFile);
		_db.pragma("journal_mode = WAL");
	}
	return _db;
}

export function getLatestEmailCode(email: string): string | null {
	const row = testDb()
		.prepare(
			"SELECT code FROM emailcode WHERE email = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1",
		)
		.get(email) as { code: string } | undefined;
	return row?.code ?? null;
}

export function seedAdminUser(email: string, password = "Admin123!"): string {
	const id = `admin_${Math.random().toString(36).slice(2)}`;
	testDb()
		.prepare(
			"INSERT INTO adminuser (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
		)
		.run(id, email, hashSync(password, 10), new Date().toISOString());
	return id;
}

export interface SeedLicenseKeyOpts {
	key: string;
	type?: "B2C" | "B2B";
	durationDays?: number;
	maxCameras?: number;
	maxPeople?: number;
	status?: string;
	batchName?: string;
}

export function seedLicenseKey(opts: SeedLicenseKeyOpts): string {
	const id = `lkey_${Math.random().toString(36).slice(2)}`;
	testDb()
		.prepare(
			"INSERT INTO licensekey (id, key, type, durationDays, maxCameras, maxPeople, status, batchName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		)
		.run(
			id,
			opts.key,
			opts.type ?? "B2C",
			opts.durationDays ?? 30,
			opts.maxCameras ?? 4,
			opts.maxPeople ?? 10,
			opts.status ?? "ACTIVE",
			opts.batchName ?? null,
			new Date().toISOString(),
		);
	return id;
}
