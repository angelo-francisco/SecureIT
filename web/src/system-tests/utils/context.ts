import { inject } from "vitest";
import type { SystemConfig } from "../global-setup";

export type { SystemConfig };

declare module "vitest" {
	export interface ProvidedContext {
		systemConfig: SystemConfig;
	}
}

export const systemConfig: SystemConfig = inject("systemConfig");

export function api(path: string) {
	return `${systemConfig.baseURL}${path}`;
}
