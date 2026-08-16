import { api } from "./context";

export interface ApiResponse<T = unknown> {
	status: number;
	json: T;
	text: string;
	headers: Headers;
}

export interface ApiClientOptions {
	baseURL: string;
}

export class ApiClient {
	private cookies = new Map<string, string>();
	private readonly baseURL: string;

	constructor(options?: ApiClientOptions) {
		this.baseURL = options?.baseURL ?? api("");
	}

	private cookieHeader(): string {
		return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
	}

	private captureCookies(headers: Headers) {
		for (const setCookie of headers.getSetCookie?.() ?? []) {
			const [pair] = setCookie.split(";");
			const sep = pair.indexOf("=");
			if (sep === -1) continue;
			const key = pair.slice(0, sep).trim();
			const value = pair.slice(sep + 1).trim();
			if (value === "") {
				this.cookies.delete(key);
			} else {
				this.cookies.set(key, value);
			}
		}
	}

	async request<T = unknown>(
		path: string,
		options: {
			method?: string;
			body?: unknown;
			headers?: Record<string, string>;
			raw?: boolean;
		} = {},
	): Promise<ApiResponse<T>> {
		const { method, body, headers, raw } = options;
		const response = await fetch(`${this.baseURL}${path}`, {
			method: method ?? (body !== undefined ? "POST" : "GET"),
			headers: {
				"Content-Type": "application/json",
				...(headers ?? {}),
				Cookie: this.cookieHeader(),
			},
			body: body !== undefined ? JSON.stringify(body) : undefined,
			redirect: "manual",
		});

		this.captureCookies(response.headers);

		const text = await response.text();
		let json: T;
		try {
			json = text === "" ? (undefined as T) : (JSON.parse(text) as T);
		} catch {
			json = undefined as T;
		}

		if (raw) {
			return { status: response.status, json, text, headers: response.headers };
		}
		return { status: response.status, json, text, headers: response.headers };
	}

	get<T = unknown>(path: string, options?: Record<string, never>) {
		return this.request<T>(path, options);
	}

	post<T = unknown>(path: string, body?: unknown) {
		return this.request<T>(path, { method: "POST", body });
	}
}
