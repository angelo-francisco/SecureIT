import { Database } from "bun:sqlite";
import { resolve } from "node:path";

const DB_PATH = resolve(import.meta.dir, "..", "secureit.db");
const db = new Database(DB_PATH);
db.run("PRAGMA journal_mode=WAL");

console.log(`\nCleaning up licenses in ${DB_PATH}...\n`);

// 1. Show current state
const allLicenses = db
	.prepare(
		`SELECT l.id, l.userId, l.status, l.activatedAt, l.expiresAt, l.keyId, l.paymentRequestId,
		        k.key AS licenseKeyStr, k.status AS keyStatus, k.type AS keyType
		 FROM license l
		 LEFT JOIN licensekey k ON l.keyId = k.id
		 ORDER BY l.createdAt DESC`,
	)
	.all();

console.log(`Found ${allLicenses.length} license(s) total:\n`);
for (const lic of allLicenses as Record<string, unknown>[]) {
	console.log(
		`  ID: ${lic.id}  | User: ${lic.userId}  | Status: ${lic.status}  | Key: ${lic.licenseKeyStr}  | KeyStatus: ${lic.keyStatus}  | Expires: ${lic.expiresAt}`,
	);
}

// 2. For each userId, keep only the most recent license row and remove duplicates
const userIds = [
	...new Set(
		(allLicenses as Record<string, unknown>[]).map((l) => l.userId as string),
	),
];

let removedCount = 0;
let revokedKeyCount = 0;

for (const userId of userIds) {
	const userLicenses = db
		.prepare(
			`SELECT id, keyId, status FROM license WHERE userId = ? ORDER BY createdAt DESC`,
		)
		.all(userId) as { id: string; keyId: string; status: string }[];

	if (userLicenses.length <= 1) continue;

	// Keep the first (most recent), delete the rest
	const [keep, ...toRemove] = userLicenses;
	console.log(
		`\n  User ${userId}: keeping license ${keep.id} (${keep.status}), removing ${toRemove.length} duplicate(s)`,
	);

	for (const dup of toRemove) {
		// Revoke associated key
		db.prepare(`UPDATE licensekey SET status = 'REVOKED' WHERE id = ?`).run(
			dup.keyId,
		);
		revokedKeyCount++;

		// Delete duplicate license row
		db.prepare(`DELETE FROM license WHERE id = ?`).run(dup.id);
		removedCount++;
		console.log(`    Removed license ${dup.id} (was: ${dup.status})`);
	}
}

// 3. Also revoke orphaned licensekeys that are ACTIVE but have no matching active license
const orphanedKeys = db
	.prepare(
		`SELECT k.id, k.key, k.status FROM licensekey k
		 WHERE k.status = 'ACTIVE'
		 AND NOT EXISTS (
			SELECT 1 FROM license l WHERE l.keyId = k.id AND l.status = 'ACTIVE'
		 )`,
	)
	.all() as { id: string; key: string; status: string }[];

if (orphanedKeys.length > 0) {
	console.log(`\nRevoking ${orphanedKeys.length} orphaned active key(s):`);
	for (const k of orphanedKeys) {
		db.prepare(`UPDATE licensekey SET status = 'REVOKED' WHERE id = ?`).run(
			k.id,
		);
		console.log(`  Revoked key ${k.key} (id: ${k.id})`);
		revokedKeyCount++;
	}
}

// 4. Show final state
const finalLicenses = db
	.prepare(
		`SELECT l.id, l.userId, l.status, l.expiresAt,
		        k.key AS licenseKeyStr, k.status AS keyStatus
		 FROM license l
		 LEFT JOIN licensekey k ON l.keyId = k.id
		 ORDER BY l.createdAt DESC`,
	)
	.all();

console.log(`\n--- Final state ---`);
console.log(`Licenses: ${finalLicenses.length}`);
for (const lic of finalLicenses as Record<string, unknown>[]) {
	console.log(
		`  ID: ${lic.id}  | User: ${lic.userId}  | Status: ${lic.status}  | Key: ${lic.licenseKeyStr}  | KeyStatus: ${lic.keyStatus}`,
	);
}

console.log(
	`\nCleanup complete: removed ${removedCount} duplicate(s), revoked ${revokedKeyCount} key(s).`,
);
