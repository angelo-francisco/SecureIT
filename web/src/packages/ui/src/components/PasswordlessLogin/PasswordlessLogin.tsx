"use client";

import { ArrowLeft, KeyRound, Loader, Mail, ShieldCheck } from "lucide-react";
import {
	type FormEvent,
	type ReactNode,
	useCallback,
	useRef,
	useState,
} from "react";
import { useCountdown } from "../../hooks/useCountdown";
import type { AuthResponse } from "../../types/user";
import { AuthDivider } from "../AuthDivider/AuthDivider";
import { CodeInput } from "../CodeInput/CodeInput";
import { GoogleButton } from "../GoogleButton/GoogleButton";
import { OutlinedInput } from "../OutlinedInput/OutlinedInput";

type Step =
	| "email"
	| "method"
	| "password"
	| "email-code-challenge"
	| "totp"
	| "totp-challenge";

export interface PasswordlessLoginProps {
	baseUrl?: string;
	googleEnabled?: boolean;
	onAuthenticated?: (res: AuthResponse) => void;
	onError?: (message: string) => void;
	onSetupRequired?: (res: AuthResponse) => void;
	footer?: ReactNode;
}

interface CheckEmailResponse {
	valid: boolean;
	totpEnabled: boolean;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(path, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});
	const data = (await res.json().catch(() => ({}))) as T & {
		error?: string;
	};
	if (!res.ok) {
		throw new Error(data.error || "Erro na requisição");
	}
	return data;
}

export function PasswordlessLogin({
	baseUrl = "",
	googleEnabled = true,
	onAuthenticated,
	onError,
	onSetupRequired,
	footer,
}: PasswordlessLoginProps) {
	const [step, setStep] = useState<Step>("email");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [totpRequired, setTotpRequired] = useState(false);
	const challengeToken = useRef<string | null>(null);

	const { remaining, canResend, start: startCountdown } = useCountdown(60);

	const api = useCallback(
		<T,>(path: string, init?: RequestInit) =>
			apiRequest<T>(`${baseUrl}${path}`, init),
		[baseUrl],
	);

	const handleError = useCallback(
		(err: unknown) => {
			const message = err instanceof Error ? err.message : "Erro inesperado";
			onError?.(message);
		},
		[onError],
	);

	const complete = useCallback(
		(res: AuthResponse) => {
			if (res.requires_setup && res.setup_token) {
				if (onSetupRequired) {
					onSetupRequired(res);
				} else {
					window.location.href = `${baseUrl}/setup?setup_token=${encodeURIComponent(res.setup_token)}`;
				}
				return;
			}
			onAuthenticated?.(res);
		},
		[onAuthenticated, onSetupRequired, baseUrl],
	);

	const handleEmailSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			if (!email.trim() || loading) return;
			setLoading(true);
			try {
				const res = await api<CheckEmailResponse>("/api/auth/check-email", {
					method: "POST",
					body: JSON.stringify({ email: email.trim() }),
				});
				setTotpRequired(res.totpEnabled);
				setStep("method");
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		},
		[email, loading, api, handleError],
	);

	const handlePasswordSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			if (!password || loading) return;
			setLoading(true);
			try {
				const res = await api<AuthResponse>("/api/auth/login", {
					method: "POST",
					body: JSON.stringify({ email, password }),
				});
				if (res.challenge && res.challenge_token) {
					beginChallenge(res);

					if (res.challenge === "email-code") {
				        await api<{ success: boolean }>("/api/auth/email-code/challenge", {
				            method: "POST",
				            body: JSON.stringify({
				                challenge_token: res.challenge_token,
				            }),
				        });

				        startCountdown();
				    }
				    
					return;
				}
				complete(res);
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		},
		[email, password, loading, api, handleError, complete],
	);

	const beginChallenge = useCallback((res: AuthResponse) => {
		challengeToken.current = res.challenge_token ?? null;
		setCode("");
		setStep(
			res.challenge === "email-code"
				? "email-code-challenge"
				: "totp-challenge",
		);
	}, []);

	const resendChallengeCode = useCallback(async () => {
		if (!challengeToken.current || loading) return;
		setLoading(true);
		try {
			await api<{ success: boolean }>("/api/auth/email-code/challenge", {
				method: "POST",
				body: JSON.stringify({ challenge_token: challengeToken.current }),
			});
			setCode("");
			startCountdown();
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	}, [api, handleError, startCountdown, loading]);

	const verifyTOTPLogin = useCallback(
		async (value: string) => {
			if (loading) return;
			setLoading(true);
			try {
				const res = await api<AuthResponse>("/api/auth/totp/login", {
					method: "POST",
					body: JSON.stringify({ email, code: value }),
				});
				complete(res);
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		},
		[email, loading, api, handleError, complete],
	);

	const completeTOTPChallenge = useCallback(
		async (value: string) => {
			if (loading || !challengeToken.current) return;
			setLoading(true);
			try {
				const res = await api<AuthResponse>("/api/auth/totp/complete", {
					method: "POST",
					body: JSON.stringify({
						challenge_token: challengeToken.current,
						code: value,
					}),
				});
				complete(res);
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		},
		[loading, api, handleError, complete],
	);

	const completeEmailCodeChallenge = useCallback(
		async (value: string) => {
			if (loading || !challengeToken.current) return;
			setLoading(true);
			try {
				const res = await api<AuthResponse>("/api/auth/email-code/complete", {
					method: "POST",
					body: JSON.stringify({
						challenge_token: challengeToken.current,
						code: value,
					}),
				});
				complete(res);
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		},
		[loading, api, handleError, complete],
	);

	const verify = useCallback(() => {
		if (code.length !== 6 || loading) return;
		if (step === "email-code-challenge") completeEmailCodeChallenge(code);
		else if (step === "totp") verifyTOTPLogin(code);
		else if (step === "totp-challenge") completeTOTPChallenge(code);
	}, [
		code,
		step,
		loading,
		verifyTOTPLogin,
		completeTOTPChallenge,
		completeEmailCodeChallenge,
	]);

	const googleLogin = useCallback(() => {
		window.location.href = `${baseUrl}/api/auth/google`;
	}, [baseUrl]);

	const goBack = useCallback(() => {
		setCode("");
		if (
			step === "password" ||
			step === "totp" ||
			step === "email-code-challenge" ||
			step === "totp-challenge"
		) {
			setStep("method");
		} else {
			setStep("email");
		}
	}, [step]);

	const methodCardClass =
		"w-full cursor-pointer border border-border bg-surface px-5 py-4 text-left text-lg font-medium text-text transition-all hover:border-primary hover:bg-surface-hover flex items-center gap-4 disabled:opacity-50";

	return (
		<div className="w-full">
			{step === "email" && (
				<div className="space-y-5">
					{googleEnabled && (
						<>
							<GoogleButton onClick={googleLogin} />
							<AuthDivider />
						</>
					)}

					<form onSubmit={handleEmailSubmit} className="space-y-4">
						<OutlinedInput
							id="login-email"
							label="Endereço de E-mail"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							icon={<Mail />}
							labelSize="xl"
							autoComplete="email"
						/>
						<button
							type="submit"
							disabled={!email.trim() || loading}
							className="cursor-pointer w-full bg-primary text-white text-lg font-medium py-3 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
						>
							{loading ? (
								<Loader size={18} className="animate-spin" />
							) : (
								<>Continuar</>
							)}
						</button>
					</form>
				</div>
			)}

			{step === "method" && (
				<div className="space-y-4">
					<div className="flex items-center justify-between text-text text-base">
						Endereço de e-mail<span className="text-base text-text-muted truncate">{email}</span>
					</div>

					<button
						type="button"
						className={methodCardClass}
						onClick={() => setStep("password")}
					>
						<KeyRound size={20} className="shrink-0 text-primary" />
						<div className="flex-1">
							<div>Entrar com palavra-passe</div>
							<div className="text-sm font-normal text-text-muted">
								Palavra-passe e código enviado para o seu e-mail
							</div>
						</div>
					</button>

					{totpRequired && (
						<button
							type="button"
							className={methodCardClass}
							onClick={() => setStep("totp")}
						>
							<ShieldCheck size={20} className="shrink-0 text-primary" />
							<div className="flex-1">
								<div>Usar autenticador</div>
								<div className="text-sm font-normal text-text-muted">
									Introduza o código da aplicação de autenticação
								</div>
							</div>
						</button>
					)}

					<button
							type="button"
							onClick={goBack}
							className="w-full border border-border text-center cursor-pointer text-text-muted hover:text-text hover:bg-gray-700 font-bold text-base py-2.5 transition-colors"
						>
							Voltar
						</button>
				</div>
			)}

			{step === "password" && (
				<form onSubmit={handlePasswordSubmit} className="space-y-4">
					<OutlinedInput
						id="login-password"
						label="Palavra-passe"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						icon={<KeyRound />}
						labelSize="xl"
						autoComplete="current-password"
					/>
					<div className="flex items-center justify-between gap-3">
						<button
							type="button"
							onClick={goBack}
							disabled={loading}
							className="px-3 border border-border py-3 hover:bg-gray-700 transition-colors cursor-pointer text-text flex items-center justify-center"
						>
							<ArrowLeft size={20} />
						</button>
					<button
						type="submit"
						disabled={!password || loading}
						className="cursor-pointer w-full bg-primary text-white text-lg font-medium py-2.5 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
					>
						{loading ? (
							<Loader size={18} className="animate-spin" />
						) : (
							<>Entrar</>
						)}
					</button>
				</div>
				</form>
			)}

			{(step === "email-code-challenge" ||
				step === "totp" ||
				step === "totp-challenge") && (
				<div className="space-y-5">
					{step === "email-code-challenge" && (
						<div className="text-center">
							<p className="text-lg text-text">
								Confirme com o código por e-mail
							</p>
							<p className="text-sm text-text-muted mt-1">
								Enviamos um código para&nbsp;
								<span className="font-bold">{email}</span>
							</p>
						</div>
					)}
					{step === "totp" && (
						<div className="text-center">
							<p className="text-lg text-text">
								Introduza o código do autenticador
							</p>
							<p className="text-sm text-text-muted mt-1">
								Abra a aplicação de autenticação e insira o código de 6 dígitos
							</p>
						</div>
					)}
					{step === "totp-challenge" && (
						<div className="text-center">
							<p className="text-lg text-text">Confirme com o autenticador</p>
							<p className="text-sm text-text-muted mt-1">
								Introduza o código de 6 dígitos da aplicação de autenticação
							</p>
						</div>
					)}

					<CodeInput value={code} onChange={setCode} disabled={loading} />

					<div className="flex items-center justify-between gap-3">
						<button
							type="button"
							onClick={goBack}
							disabled={loading}
							className="px-3 border border-border py-3 hover:bg-gray-700 transition-colors cursor-pointer text-text flex items-center justify-center"
						>
							<ArrowLeft size={20} />
						</button>
						<button
							type="button"
							disabled={code.length !== 6 || loading}
							onClick={verify}
							className="w-full py-2.5 bg-primary disabled:cursor-not-allowed cursor-pointer text-text text-lg font-bold flex items-center justify-center gap-2"
						>
							{loading ? (
								<Loader size={18} className="animate-spin" />
							) : (
								<>Verificar</>
							)}
						</button>
					</div>
					{step === "email-code-challenge" && (
						<div className="text-center">
							{canResend ? (
								<span className="text-text-muted text-lg">Não recebeu o código?&nbsp;<button
									type="button"
									disabled={loading}
									onClick={resendChallengeCode}
									className="text-primary font-bold hover:underline cursor-pointer disabled:opacity-50"
								>
									Reenviar código
								</button></span>
							) : (
								<span className="text-base text-text-muted">
									Reenviar em {remaining}s
								</span>
							)}
						</div>
					)}
				</div>
			)}

			{footer && <div className="mt-8">{footer}</div>}
		</div>
	);
}
