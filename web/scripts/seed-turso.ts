import { createClient } from "@libsql/client/http";
import { createId } from "@paralleldrive/cuid2";
import { hashSync } from "bcryptjs";
import { normalizeTursoUrl } from "../src/lib/turso";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
	console.error("TURSO_DATABASE_URL is not set.");
	process.exit(1);
}

const client = createClient({
	url: normalizeTursoUrl(url),
	authToken: process.env.TURSO_AUTH_TOKEN,
});

const run = (sql: string, params?: (string | number | null)[]) =>
	params ? client.execute({ sql, args: params }) : client.execute(sql);

async function query(
	sql: string,
	params?: (string | number | null)[],
): Promise<unknown[]> {
	const res = params
		? await client.execute({ sql, args: params })
		: await client.execute(sql);
	return res.rows;
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

	console.log(`Seeding ${normalizeTursoUrl(url)}...\n`);

	const existingAdmin = await query(
		"SELECT id FROM AdminUser WHERE email = ? LIMIT 1",
		[adminEmail],
	);
	if (existingAdmin.length > 0) {
		console.log("Admin already exists, skipping.");
	} else {
		const id = createId();
		await run(
			"INSERT INTO AdminUser (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
			[id, adminEmail, adminPasswordHash, now],
		);
		console.log(`Admin created (id: ${id})`);
	}

	const existingPlans = await query("SELECT id, name FROM Plan");
	if (existingPlans.length > 0) {
		console.log(
			`Plans exist (${existingPlans
				.map((p) => (p as { name?: unknown }).name)
				.join(", ")}), skipping.`,
		);
	} else {
		const planId = createId();
		await run(
			`INSERT INTO Plan (id, name, description, basePrice, currency, durationDays, isActive, isDefault, createdAt, updatedAt) VALUES (?, 'Licença', 'Acesso completo a todas as funcionalidades do SecureIT', 81.27, 'USD', 30, 1, 1, ?, ?)`,
			[planId, now, now],
		);

		const features = [
			{
				name: "Análise Comportamental",
				desc: "Análise avançada de comportamento em tempo real",
			},
			{ name: "Cloud Storage", desc: "Armazenamento de gravações na cloud" },
			{
				name: "Tunnel de Acesso Remoto",
				desc: "Acesso remoto seguro às suas câmeras",
			},
		];
		for (const f of features) {
			await run(
				"INSERT INTO PlanFeature (id, planId, name, description, price, isActive, createdAt) VALUES (?, ?, ?, ?, 0, 1, ?)",
				[createId(), planId, f.name, f.desc, now],
			);
		}
		console.log(`Plan "Licença" created with ${features.length} features`);
	}

	const existingPi = await query("SELECT id FROM PaymentInfo LIMIT 1");
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
		await run(
			"INSERT INTO PaymentInfo (id, iban, accountName, bankName, reference, isActive, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)",
			[piId, encIban, encName, encBank, encRef, now],
		);
		console.log(`Payment info created (id: ${piId})`);
	}

	console.log("\nSeed complete.");

	await client.close();
}

main().catch((error) => {
	console.error("Seed failed:", error);
	process.exit(1);
});
