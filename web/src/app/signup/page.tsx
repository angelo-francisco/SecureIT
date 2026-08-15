"use client";

import { ArrowLeft, Loader, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";

import { MaterialPhoneInput, OutlinedInput, useToast } from "@/packages/ui";

export default function SignupPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [step, setStep] = useState(1);
	const [email, setEmail] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [passwordsError, setPasswordsError] = useState(false);

	const handleStep1 = (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) return;
		setStep(2);
	};

	const handleStep2 = (e: React.FormEvent) => {
		e.preventDefault();
		if (!firstName || !lastName || !phone) return;
		setStep(3);
	};

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordsError(false);

		if (password.length < 12) {
			setPasswordsError(true);
			toast("Palavra-passe deve ter pelo menos 12 caracteres");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					firstName,
					lastName,
					phone: phone || undefined,
					password,
				}),
			});
			const data = await res.json();
			if (!res.ok)
				throw new Error(
					(data as { error?: string }).error || "Erro ao criar conta",
				);
			if (data.requires_setup && data.setup_token) {
				router.push(
					`/setup?setup_token=${encodeURIComponent(data.setup_token)}`,
				);
			} else {
				router.push("/my-account");
			}
		} catch (err) {
			toast(err instanceof Error ? err.message : "Erro ao criar conta");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen">
			<Navbar minimal />
			<section className="fixed inset-0 flex justify-center items-center">
				<div className="p-8 md:p-4 flex flex-col items-center w-full max-w-[500px]">
					<div className="w-full flex flex-col items-center">
						<div className="flex flex-col items-center justify-center gap-1 mb-8">
							<h1 className="text-center text-4xl md:text-5xl font-semibold">
								Criar Conta
							</h1>
							<p className="text-text-muted text-lg md:text-xl">
								Insira os seus dados abaixo para continuar
							</p>
						</div>

						<form
							className="w-full space-y-8"
							onSubmit={
								step === 1
									? handleStep1
									: step === 2
										? handleStep2
										: handleSignup
							}
						>
							{step === 1 && (
								<>
									<div className="space-y-5">
										<OutlinedInput
											id="email"
											label="Endereço de e-mail"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											labelSize="xl"
											icon={<Mail />}
										/>
									</div>
									<button
										type="submit"
										disabled={!email || loading}
										className="w-full cursor-pointer bg-primary text-white text-lg font-medium py-3.5 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
									>
										Avançar
									</button>
									<div className="text-center">
										<p className="text-lg text-text-muted">
											Já tem conta?{" "}
											<Link
												href="/login"
												className="text-primary font-bold hover:underline"
											>
												Inicar Sessão
											</Link>
										</p>
									</div>
								</>
							)}

							{step === 2 && (
								<>
									<div className="space-y-5">
										<div className="flex flex-col gap-5">
											<div className="flex gap-3">
												<OutlinedInput
													id="firstName"
													label="Primeiro Nome"
													value={firstName}
													onChange={(e) => setFirstName(e.target.value)}
													labelSize="xl"
												/>
												<OutlinedInput
													id="lastName"
													label="Último Nome"
													value={lastName}
													onChange={(e) => setLastName(e.target.value)}
													labelSize="xl"
												/>
											</div>
											<MaterialPhoneInput
												value={phone}
												onChange={(v) => setPhone(v ?? "")}
											/>
										</div>
									</div>
									<div className="flex gap-3">
										<button
											type="button"
											onClick={() => setStep(1)}
											className="cursor-pointer w-14 shrink-0 border border-border  py-3.5 text-text-muted hover:text-text hover:border-text-muted transition-all flex items-center justify-center gap-1.5"
										>
											<ArrowLeft />
										</button>
										<button
											type="submit"
											disabled={!firstName || !lastName || !phone || loading}
											className="cursor-pointer flex-1 bg-primary text-white text-lg font-medium py-3.5  hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
										>
											Avançar
										</button>
									</div>
								</>
							)}

							{step === 3 && (
								<>
									<div className="space-y-5">
										<div className="relative">
											<OutlinedInput
												id="password"
												label="Palavra-passe"
												type={showPassword ? "text" : "password"}
												value={password}
												onChange={(e) => {
													setPassword(e.target.value);
													setPasswordsError(false);
												}}
												error={passwordsError}
												labelSize="xl"
											/>
										</div>
										<div className="w-full flex justify-between">
											<p className="text-base md:text-lg text-text-muted">
												Use palavras-passe com no mínimo de 12 caracteres
											</p>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="cursor-pointer z-[999] text-text-muted hover:text-primary transition-colors"
											>
												{showPassword ? "Esconder" : "Ver"}
											</button>
										</div>
									</div>
									<div className="flex gap-3">
										<button
											type="button"
											onClick={() => setStep(2)}
											className="cursor-pointer w-14 shrink-0 border border-border  py-3.5 text-text-muted hover:text-text hover:border-text-muted transition-all flex items-center justify-center gap-1.5"
										>
											<ArrowLeft />
										</button>
										<button
											type="submit"
											disabled={!password || loading}
											className="cursor-pointer flex-1 bg-primary text-white text-lg font-medium py-3.5  hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
										>
											{loading ? (
												<Loader size={18} className="animate-spin" />
											) : (
												<>Criar Conta</>
											)}
										</button>
									</div>
								</>
							)}
						</form>
					</div>
				</div>
			</section>
		</div>
	);
}
