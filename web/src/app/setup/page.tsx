"use client";

import { ArrowLeft, Check, Loader, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CodeInput, useCountdown, useToast } from "@/packages/ui";

export const dynamic = "force-dynamic";

type Step = "loading" | "error" | "email" | "totp" | "done";

interface StatusResponse {
	email: string;
	emailVerified: boolean;
	email2faEnabled: boolean;
	totpEnabled: boolean;
}

export default function SetupPage() {
	return (
		<Suspense fallback={null}>
			<SetupContent />
		</Suspense>
	);
}

function SetupContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();
	const [setupToken, setSetupToken] = useState("");
	const [step, setStep] = useState<Step>("loading");
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [secret, setSecret] = useState("");
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const statusStarted = useRef(false);

	const { remaining, canResend, start: startCountdown } = useCountdown(60);

	useEffect(() => {
		setSetupToken(searchParams.get("setup_token") ?? "");
	}, [searchParams]);

	const sendCode = useCallback(async () => {
		if (!setupToken || loading) return;
		setLoading(true);
		try {
			const res = await fetch("/api/auth/setup/email/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ setup_token: setupToken }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Erro ao enviar o código");
			setCode("");
			startCountdown();
		} catch (err) {
			toast(err instanceof Error ? err.message : "Erro inesperado");
		} finally {
			setLoading(false);
		}
	}, [setupToken, loading, startCountdown, toast]);

	const startTotp = useCallback(async () => {
		if (!setupToken || loading) return;
		setLoading(true);
		try {
			const res = await fetch("/api/auth/setup/totp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ setup_token: setupToken }),
			});
			const data = await res.json();
			if (!res.ok)
				throw new Error(data.error || "Erro ao iniciar o autenticador");
			setSecret(data.secret);
			const url = await QRCode.toDataURL(data.uri, {
				width: 220,
				margin: 1,
				color: { dark: "#0b0f14", light: "#ffffff" },
			});
			setQrDataUrl(url);
			setStep("totp");
		} catch (err) {
			toast(err instanceof Error ? err.message : "Erro inesperado");
		} finally {
			setLoading(false);
		}
	}, [setupToken, loading, toast]);

	const verifyEmail = useCallback(
		async (value: string) => {
			if (!setupToken || loading) return;
			setLoading(true);
			try {
				const res = await fetch("/api/auth/setup/email/verify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ setup_token: setupToken, code: value }),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Código inválido");
				toast("E-mail verificado com sucesso", "success");
				setCode("");
				if (data.access_token) {
					setStep("done");
					router.push("/my-account");
				} else {
					startTotp();
				}
			} catch (err) {
				toast(err instanceof Error ? err.message : "Erro inesperado");
			} finally {
				setLoading(false);
			}
		},
		[setupToken, loading, toast, startTotp, router],
	);

	const verifyTotp = useCallback(
		async (value: string) => {
			if (!setupToken || loading) return;
			setLoading(true);
			try {
				const res = await fetch("/api/auth/setup/totp/verify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ setup_token: setupToken, code: value }),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Código inválido");
				toast("Autenticador configurado com sucesso", "success");
				setStep("done");
				router.push("/my-account");
			} catch (err) {
				toast(err instanceof Error ? err.message : "Erro inesperado");
			} finally {
				setLoading(false);
			}
		},
		[setupToken, loading, toast, router],
	);

	const goBack = useCallback(() => {
		router.push("/login");
	}, [router]);

	useEffect(() => {
		if (!setupToken || statusStarted.current) return;
		statusStarted.current = true;
		fetch("/api/auth/setup/status", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ setup_token: setupToken }),
		})
			.then(async (res) => {
				if (res.status === 401 || res.status === 400) {
					setStep("error");
					return null;
				}
				const data = (await res.json()) as StatusResponse;
				return res.ok ? data : null;
			})
			.then((data) => {
				if (!data) {
					setStep("error");
					return;
				}
				setEmail(data.email);
				if (!data.emailVerified) {
					setStep("email");
					sendCode();
				} else if (!data.totpEnabled) {
					startTotp();
				} else {
					setStep("done");
					router.replace("/login");
				}
			})
			.catch(() => setStep("error"));
	}, [setupToken, sendCode, startTotp, router]);

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="w-full max-w-[520px] p-6">
				<div className="flex flex-col items-center gap-1 mb-8">
					<h1 className="text-center text-3xl font-semibold">
						Configuração de Segurança
					</h1>
					<p className="text-text-muted text-lg md:text-xl text-center">
						Complete os passos abaixo para ativar a sua conta
					</p>
				</div>

				{step === "loading" && (
					<div className="flex justify-center py-12">
						<Loader size={32} className="animate-spin text-primary" />
					</div>
				)}

				{step === "error" && (
					<div className="text-center space-y-4 py-8">
						<p className="text-lg text-text">
							Sessão de configuração inválida ou expirada.
						</p>
						<Link
							href="/login"
							className="inline-block bg-primary text-white text-lg font-medium px-6 py-3 hover:brightness-110"
						>
							Voltar ao login
						</Link>
					</div>
				)}

				{step === "email" && (
					<div className="space-y-5 bg-surface p-6 border">
						<div className="text-center">
							<p className="text-lg text-text mt-2">Verifique o seu e-mail</p>
							<p className="text-base text-text-muted mt-1">
								Enviamos um código para{" "}
								<span className="font-bold">{email}</span>
							</p>
						</div>
						<CodeInput value={code} onChange={setCode} disabled={loading} />
						<div className="text-center">
							{canResend ? (
								<button
									type="button"
									disabled={loading}
									onClick={sendCode}
									className="cursor-pointer text-primary hover:underline disabled:opacity-50"
								>
									Reenviar código
								</button>
							) : (
								<span className="text-base text-text-muted">
									Reenviar em {remaining}s
								</span>
							)}
						</div>
						<div className="flex items-center justify-between gap-3">
							<button
								type="button"
								onClick={goBack}
								disabled={loading}
								className="px-3 border py-3 hover:bg-gray-700 transition-colors cursor-pointer text-text flex items-center justify-center"
							>
								<ArrowLeft size={20} />
							</button>
							<button
								type="button"
								disabled={code.length !== 6 || loading}
								onClick={() => verifyEmail(code)}
								className="w-full border py-3 bg-primary disabled:cursor-not-allowed cursor-pointer text-text text-lg font-bold flex items-center justify-center gap-2"
							>
								{loading ? (
									<Loader size={20} className="animate-spin" />
								) : (
									<>Verificar</>
								)}
							</button>
						</div>
					</div>
				)}

				{step === "totp" && (
					<div className="space-y-5 bg-surface p-6 border">
						<div className="text-center">
							<p className="text-lg text-text mt-2">Configure o autenticador</p>
							<p className="text-base text-text-muted mt-1">
								Digitalize o código QR com a aplicação de autenticação (Google
								Authenticator, Authy, etc.)
							</p>
						</div>
						<div className="flex justify-center">
							{qrDataUrl && (
								// biome-ignore lint/performance/noImgElement: QR generated locally as data URL
								<img
									src={qrDataUrl}
									alt="Código QR do autenticador"
									className="h-[220px] w-[220px]"
								/>
							)}
						</div>
						{secret && (
							<div className="text-center">
								<p className="text-base text-text-muted">
									Ou introduza manualmente o código secreto:
								</p>
								<p className="mt-1 break-all font-mono text-lg text-text select-all">
									{secret}
								</p>
							</div>
						)}
						<p className="text-base text-text-muted text-center">
							Depois de adicionar, introduza o código de 6 dígitos
						</p>
						<CodeInput value={code} onChange={setCode} disabled={loading} />
						<div className="flex items-center justify-between gap-3">
							<button
								type="button"
								onClick={goBack}
								disabled={loading}
								className="px-3 border py-3 hover:bg-gray-700 transition-colors cursor-pointer text-text flex items-center justify-center"
							>
								<ArrowLeft size={20} />
							</button>
							<button
								type="button"
								disabled={code.length !== 6 || loading}
								onClick={() => verifyTotp(code)}
								className="w-full border py-3 bg-primary disabled:cursor-not-allowed cursor-pointer text-text text-lg font-bold flex items-center justify-center gap-2"
							>
								{loading ? (
									<Loader size={20} className="animate-spin" />
								) : (
									<>Verificar</>
								)}
							</button>
						</div>
					</div>
				)}

				{step === "done" && (
					<div className="text-center space-y-4 py-8">
						<Check size={32} className="text-primary mx-auto" />
						<p className="text-lg text-text">Configuração concluída!</p>
						<p className="text-base text-text-muted">
							A redirecionar para a sua conta…
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
