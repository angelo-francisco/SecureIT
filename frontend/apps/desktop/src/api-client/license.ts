import { apiClient } from "./client";

export interface LicenseData {
  valid: boolean;
  licenseId: string;
  expiresAt: string;
  activatedAt: string;
  type: "TRIAL" | "STANDARD";
  daysRemaining: number;
  error?: string;
}

export interface LicenseValidationResponse {
  valid: boolean;
  expiresAt: string;
  activatedAt: string;
  type: "TRIAL" | "STANDARD";
  isActive: boolean;
  daysRemaining: number;
  error?: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const licenseApi = {
  activate: (data: {
    key: string;
    email: string;
    machineHash?: string;
  }) => apiClient.post<LicenseData>("/api/licenses/activate", data),

  validate: (data: { licenseId: string; machineHash?: string }) =>
    apiClient.post<LicenseValidationResponse>("/api/licenses/validate", data),
};
