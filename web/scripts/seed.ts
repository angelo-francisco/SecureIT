import { createId } from "@paralleldrive/cuid2";
import { Database } from "bun:sqlite";
import { hashSync } from "bcryptjs";
import { readFileSync } from "fs";
import { resolve } from "path";

const DB_PATH = resolve(import.meta.dir, "..", "secureit.db");
const MIGRATIONS = [
	resolve(import.meta.dir, "..", "src", "db", "0000_dizzy_redwing.sql"),
	resolve(import.meta.dir, "..", "src", "db", "0001_absurd_fat_cobra.sql"),
];

const db = new Database(DB_PATH);
db.run("PRAGMA journal_mode=WAL");

function run(sql: string, params?: any[]) {
	if (params) {
		db.prepare(sql).run(...params);
	} else {
		db.exec(sql);
	}
}

function query(sql: string, params?: any[]): any[] {
	return params ? db.prepare(sql).all(...params) : db.prepare(sql).all();
}

async function encryptPaymentField(text: string): Promise<string> {
	const keyText =
		process.env.PAYMENT_ENCRYPTION_KEY ||
		"secureit_payment_db_secret_key_v1_32b";
	const encoder = new TextEncoder();
	const keyData = encoder.encode(keyText.padEnd(32, "0").slice(0, 32));
	const key = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "AES-GCM" },
		false,
		["encrypt"],
	);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		encoder.encode(text),
	);
	const ivHex = Array.from(iv)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	const cipherHex = Array.from(new Uint8Array(encrypted))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `enc:${ivHex}:${cipherHex}`;
}

async function main() {
	const adminEmail = "admin@secureit.com";
	const adminPasswordHash = hashSync("admin123", 12);
	const now = new Date().toISOString();

	console.log(`\nSeeding ${DB_PATH}...\n`);

	for (const m of MIGRATIONS) {
		console.log(`Applying ${m.split("/").pop()}...`);
		db.exec(readFileSync(m, "utf-8"));
	}
	console.log("Migrations applied.\n");

	// --- Admin ---
	const existingAdmin = query(
		"SELECT id FROM AdminUser WHERE email = ? LIMIT 1",
		[adminEmail],
	);
	if (existingAdmin.length > 0) {
		console.log("Admin already exists, skipping.");
	} else {
		const id = createId();
		run(
			"INSERT INTO AdminUser (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
			[id, adminEmail, adminPasswordHash, now],
		);
		console.log(`Admin created (id: ${id})`);
	}

	// --- Plan ---
	const existingPlans = query("SELECT id, name FROM Plan");
	if (existingPlans.length > 0) {
		console.log(`Plans exist (${existingPlans.map((p: any) => p.name).join(", ")}), skipping.`);
	} else {
		const planId = createId();
		run(
			`INSERT INTO Plan (id, name, description, basePrice, currency, durationDays, isActive, isDefault, createdAt, updatedAt) VALUES (?, 'Licença', 'Acesso completo a todas as funcionalidades do SecureIT', 81.27, 'USD', 30, 1, 1, ?, ?)`,
			[planId, now, now],
		);

		const features = [
			{ name: "Análise Comportamental", desc: "Análise avançada de comportamento em tempo real" },
			{ name: "Cloud Storage", desc: "Armazenamento de gravações na cloud" },
			{ name: "Tunnel de Acesso Remoto", desc: "Acesso remoto seguro às suas câmeras" },
		];
		for (const f of features) {
			run(
				"INSERT INTO PlanFeature (id, planId, name, description, price, isActive, createdAt) VALUES (?, ?, ?, ?, 0, 1, ?)",
				[createId(), planId, f.name, f.desc, now],
			);
		}
		console.log(`Plan "Licença" created with ${features.length} features`);
	}

	// --- Payment Info ---
	const existingPi = query("SELECT id FROM PaymentInfo LIMIT 1");
	if (existingPi.length > 0) {
		console.log("Payment info already exists, skipping.");
	} else {
		const piId = createId();
		const [encIban, encName, encBank, encRef] = await Promise.all([
			encryptPaymentField("PT50 0002 0000 0000 0000 0000 0"),
			encryptPaymentField("SecureIT Angola Lda"),
			encryptPaymentField("Banco Angolano de Investimentos"),
			encryptPaymentField("SecureIT-"),
		]);
		run(
			"INSERT INTO PaymentInfo (id, iban, accountName, bankName, reference, isActive, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)",
			[piId, encIban, encName, encBank, encRef, now],
		);
		console.log(`Payment info created (id: ${piId})`);
	}

	console.log("\nSeed complete.");
}

main().catch(console.error);
