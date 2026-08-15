export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	phone: string | null;
	totpEnabled: boolean;
	email2faEnabled: boolean;
	isActive: boolean;
	createdAt: string;
}

export interface SignupFormData {
	email: string;
	firstName: string;
	lastName: string;
	phone?: string;
	password: string;
}

export interface LoginData {
	email: string;
	password: string;
}

export interface EmailCodeData {
	email: string;
	code: string;
}

export interface TOTPVerifyData {
	code: string;
}

export interface CheckEmailResponse {
	valid: boolean;
	totpEnabled: boolean;
	email2faEnabled: boolean;
}

export interface TOTPLoginData {
	email: string;
	code: string;
}

export interface TOTPChallengeData {
	challenge_token: string;
	code: string;
}

export interface AuthResponse {
	access_token?: string;
	user?: User;
	challenge?: "totp" | "email-code";
	challenge_token?: string;
	requires_setup?: boolean;
	setup_token?: string;
	email?: string;
}

export interface SignupRequest {
	email: string;
	firstName: string;
	lastName: string;
	phone?: string;
	password: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface ReAuthData {
	email: string;
	password: string;
}
