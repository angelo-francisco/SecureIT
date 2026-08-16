import { spawn } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

const WEB_ROOT = resolve(__dirname, "../..");
const TRACKED_FILES = ["tsconfig.json", "next-env.d.ts"];

export interface SystemConfig {
	baseURL: string;
	port: number;
	dbFile: string;
}

function testTmpRoot(): string {
	const osTmp = tmpdir();
	if (isAbsolute(osTmp)) return osTmp;
	return "/tmp";
}

function getFreePort(): Promise<number> {
	return new Promise((resolvePort, reject) => {
		const server = createServer();
		server.unref();
		server.on("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (address && typeof address === "object") {
				const port = address.port;
				server.close(() => resolvePort(port));
			} else {
				server.close(() => reject(new Error("Could not allocate port")));
			}
		});
	});
}

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

export default async function setup({
	provide,
}: {
	provide: (key: string, value: unknown) => void;
}) {
	const tempDir = await mkdtemp(join(testTmpRoot(), "secureit-system-"));
	const dbFile = join(tempDir, "secureit.db");
	const distDir = join(tempDir, ".next-test");
	const port = await getFreePort();
	const baseURL = `http://127.0.0.1:${port}`;

	const originalFiles = new Map<string, string>();
	for (const name of TRACKED_FILES) {
		try {
			originalFiles.set(name, await readFile(join(WEB_ROOT, name), "utf-8"));
		} catch {}
	}

	const { privateKey, publicKey } = generateKeyPairSync("ed25519");
	const privatePem = privateKey
		.export({ type: "pkcs8", format: "pem" })
		.toString();
	const publicPem = publicKey
		.export({ type: "spki", format: "pem" })
		.toString();

	const logs: string[] = [];
	const child = spawn(
		"bun",
		[
			"node_modules/next/dist/bin/next",
			"dev",
			"-p",
			String(port),
			"-H",
			"127.0.0.1",
		],
		{
			cwd: WEB_ROOT,
			detached: true,
			env: {
				...process.env,
				NODE_ENV: "development",
				SECUREIT_DB_FILE: dbFile,
				NEXT_DIST_DIR: distDir,
				NEXT_TURBOPACK_ROOT: WEB_ROOT,
				NEXT_TELEMETRY_DISABLED: "1",
				GMAIL_USER: "",
				GMAIL_APP_PASSWORD: "",
				JWT_SECRET: "system-test-secret-0123456789abcdef",
				JWT_REFRESH_SECRET: "system-test-refresh-secret-0123456789",
				ED25519_PRIVATE_KEY: privatePem,
				ED25519_PUBLIC_KEY: publicPem,
				NEXTAUTH_URL: baseURL,
				NEXTAUTH_SECRET: "system-test-nextauth-secret",
				TURSO_DATABASE_URL: "",
				TURSO_AUTH_TOKEN: "",
			},
			stdio: ["ignore", "pipe", "pipe"],
		},
	);

	child.stdout?.on("data", (chunk: Buffer) => {
		logs.push(chunk.toString());
	});
	child.stderr?.on("data", (chunk: Buffer) => {
		logs.push(chunk.toString());
	});

	const deadline = Date.now() + 120_000;
	let ready = false;
	while (Date.now() < deadline) {
		if (child.exitCode !== null || child.signalCode) {
			throw new Error(
				`Next server exited early (code=${child.exitCode}, signal=${child.signalCode})\n${logs.join("")}`,
			);
		}
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 5_000);
			const res = await fetch(`${baseURL}/api/plans`, {
				signal: controller.signal,
			});
			clearTimeout(timeout);
			if (res.ok) {
				ready = true;
				break;
			}
		} catch {}
		await sleep(1_000);
	}

	if (!ready) {
		killGroup(child);
		throw new Error(`Next server did not become ready\n${logs.join("")}`);
	}

	await warmPages(baseURL, logs, child);

	provide("systemConfig", { baseURL, port, dbFile } satisfies SystemConfig);

	return async () => {
		killGroup(child);
		await sleep(2_000);
		await rm(tempDir, { recursive: true, force: true });
		for (const [name, content] of originalFiles) {
			try {
				await writeFile(join(WEB_ROOT, name), content, "utf-8");
			} catch {}
		}
	};
}

function killGroup(child: ReturnType<typeof spawn>) {
	const pid = child.pid;
	if (pid === undefined) return;
	try {
		process.kill(-pid, "SIGTERM");
	} catch {}
	setTimeout(() => {
		try {
			process.kill(-pid, "SIGKILL");
		} catch {}
	}, 2_000);
}

async function warmPages(
	baseURL: string,
	logs: string[],
	child: ReturnType<typeof spawn>,
) {
	const pages = [
		"/",
		"/login",
		"/signup",
		"/setup",
		"/pricing",
		"/my-account",
		"/admin",
	];
	for (const page of pages) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 60_000);
			const res = await fetch(`${baseURL}${page}`, {
				signal: controller.signal,
				redirect: "manual",
			});
			clearTimeout(timeout);
			if (![200, 302, 307, 308].includes(res.status)) {
				logs.push(`[warm] ${page} -> ${res.status}`);
			}
		} catch (error) {
			logs.push(`[warm] ${page} failed: ${String(error)}`);
		}
	}
	if (child.exitCode !== null || child.signalCode) {
		throw new Error(`Next server exited during page warmup\n${logs.join("")}`);
	}
}
