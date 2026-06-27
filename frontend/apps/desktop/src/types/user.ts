export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
}

export interface Account {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface SignupFormData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  pin: string;
}

export interface SignupStep1 {
  email: string;
}

export interface SignupStep2 {
  first_name: string;
  last_name: string;
  phone: string;
}

export interface SignupStep3 {
  password: string;
  pin: string;
}

export interface PinLoginData {
  email: string;
  pin: string;
}

export interface SignupRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  pin: string;
}

export interface PinLoginTokenResponse {
  access_token: string;
  pin_token: string;
  user: User;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface SignupResponse {
  access_token: string;
  pin_token: string;
  user: User;
}

export interface ReAuthData {
  email: string;
  pin: string;
}
