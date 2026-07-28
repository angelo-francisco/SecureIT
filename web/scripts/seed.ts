import { createId } from "@paralleldrive/cuid2";
import { Database } from "bun:sqlite";
import { hashSync } from "bcryptjs";
import { readFileSync } from "fs";
import { resolve } from "path";

const DB_PATH = resolve(import.meta.dir, "..", "secureit.db");
const MIGRATION_PATH = resolve(import.meta.dir, "..", "src", "db", "0000_dizzy_redwing.sql");

const db = new Database(DB_PATH);
db.run("PRAGMA journal_mode=WAL");

// Apply migration if tables don't exist yet
const tablesExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='User'").get();
if (!tablesExist) {
	console.log("Applying migration...");
	const sql = readFileSync(MIGRATION_PATH, "utf-8");
	db.exec(sql);
	console.log("Migration applied.");
}

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

function main() {
	const adminEmail = "admin@secureit.com";
	const adminPasswordHash = hashSync("admin123", 12);
	const now = new Date().toISOString();

	console.log(`\nSeeding ${DB_PATH}...\n`);

	// --- Admin User ---
	console.log(`Checking for admin user (${adminEmail})...`);
	const existingAdmin = query(
		"SELECT id FROM AdminUser WHERE email = ? LIMIT 1",
		[adminEmail],
	);

	if (existingAdmin.length > 0) {
		console.log("Admin user already exists, skipping.");
	} else {
		const adminId = createId();
		run(
			"INSERT INTO AdminUser (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
			[adminId, adminEmail, adminPasswordHash, now],
		);
		console.log(`Admin user created (id: ${adminId})`);
	}

	// --- Plans ---
	console.log("\nChecking for existing plans...");
	const existingPlans = query("SELECT id, name FROM Plan");
	const existingPlanNames = new Set(existingPlans.map((p: any) => p.name));

	if (existingPlanNames.size > 0) {
		console.log(
			`Plans already exist (${[...existingPlanNames].join(", ")}), skipping.`,
		);
	} else {
		const b2cId = createId();
		const b2bId = createId();

		const features = [
			{
				name: "Análise Comportamental",
				desc: "Análise avançada de comportamento em tempo real",
			},
			{
				name: "Cloud Storage",
				desc: "Armazenamento de gravações na cloud",
			},
			{
				name: "Tunnel de Acesso Remoto",
				desc: "Acesso remoto seguro às suas câmeras",
			},
		];

		// B2C Plan (default)
		run(
			`INSERT INTO Plan (id, name, description, basePrice, currency, durationDays, isActive, isDefault, createdAt, updatedAt) VALUES (?, 'B2C', 'Para residências ou utilizadores individuais', 75.25, 'USD', 30, 1, 1, ?, ?)`,
			[b2cId, now, now],
		);
		for (const f of features) {
			run(
				`INSERT INTO PlanFeature (id, planId, name, description, price, isActive, createdAt) VALUES (?, ?, ?, ?, 0, 1, ?)`,
				[createId(), b2cId, f.name, f.desc, now],
			);
		}
		run(
			`INSERT INTO PlanService (id, planId, name, description, price, isActive, createdAt) VALUES (?, ?, 'Instalação e Configuração', 'Instalação profissional do sistema', 12, 1, ?)`,
			[createId(), b2cId, now],
		);
		console.log("B2C plan created with 3 features + 1 service");

		// B2B Plan
		run(
			`INSERT INTO Plan (id, name, description, basePrice, currency, durationDays, isActive, isDefault, createdAt, updatedAt) VALUES (?, 'B2B', 'Para empresas e negócios', 81.27, 'USD', 30, 1, 0, ?, ?)`,
			[b2bId, now, now],
		);
		for (const f of features) {
			run(
				`INSERT INTO PlanFeature (id, planId, name, description, price, isActive, createdAt) VALUES (?, ?, ?, ?, 0, 1, ?)`,
				[createId(), b2bId, f.name, f.desc, now],
			);
		}
		run(
			`INSERT INTO PlanService (id, planId, name, description, price, isActive, createdAt) VALUES (?, ?, 'Instalação e Configuração', 'Instalação profissional do sistema', 16, 1, ?)`,
			[createId(), b2bId, now],
		);
		console.log("B2B plan created with 3 features + 1 service");
	}

	// --- Payment Info ---
	console.log("\nChecking for existing payment info...");
	const existingPi = query("SELECT id FROM PaymentInfo LIMIT 1");

	if (existingPi.length > 0) {
		console.log("Payment info already exists, skipping.");
	} else {
		const piId = createId();
		run(
			`INSERT INTO PaymentInfo (id, iban, accountName, bankName, reference, isActive, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)`,
			[
				piId,
				"AO06 0040 0000 8891 2345 6789 1",
				"SecureIT Lda",
				"Banco BAI",
				"926422462",
				now,
			],
		);
		console.log(`Payment info created (id: ${piId})`);
	}

	console.log("\nSeed complete.");
}

main();
