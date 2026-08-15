import type { DefaultSession } from "next-auth";

declare module "next-auth" {
	interface Session {
		user: {
			googleId?: string;
			googleEmailVerified?: boolean;
		} & DefaultSession["user"];
	}
}

declare module "@auth/core/jwt" {
	interface JWT {
		googleId?: string;
		googleEmailVerified?: boolean;
	}
}
