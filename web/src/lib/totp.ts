import * as OTPAuth from "otpauth";

export function createTOTP(email: string): OTPAuth.TOTP {
	return new OTPAuth.TOTP({
		issuer: "SecureIT",
		label: email,
		algorithm: "SHA1",
		digits: 6,
		period: 30,
		secret: new OTPAuth.Secret({ size: 20 }),
	});
}

export function verifyTOTP(secret: string, token: string): boolean {
	const totp = new OTPAuth.TOTP({
		issuer: "SecureIT",
		label: "",
		algorithm: "SHA1",
		digits: 6,
		period: 30,
		secret: OTPAuth.Secret.fromBase32(secret),
	});

	const delta = totp.validate({ token, window: 1 });
	return delta !== null;
}

export function getTOTPUri(totp: OTPAuth.TOTP): string {
	return totp.toString();
}
