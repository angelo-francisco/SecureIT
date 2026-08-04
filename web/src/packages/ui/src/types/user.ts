export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	phone: string | null;
	totpEnabled: boolean;
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

export interface AuthResponse {
	user: User;
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
