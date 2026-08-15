import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
	secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
	trustHost: true,
	session: { strategy: "jwt" },
	pages: { signIn: "/login", error: "/login" },
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	],
	callbacks: {
		async jwt({ token, account, profile }) {
			if (account && profile) {
				token.googleId = profile.sub ?? undefined;
				token.googleEmailVerified = profile.email_verified === true;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.googleId = token.googleId;
				session.user.googleEmailVerified = token.googleEmailVerified;
			}
			return session;
		},
	},
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
