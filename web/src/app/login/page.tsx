"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { PasswordlessLogin, useToast } from "@/packages/ui";

export default function LoginPage() {
	const router = useRouter();
	const { toast } = useToast();

	const onAuthenticated = useCallback(() => {
		router.push("/my-account");
	}, [router]);

	const onError = useCallback(
		(message: string) => {
			toast(message);
		},
		[toast],
	);

	return (
		<div className="min-h-screen">
			<Navbar minimal />
			<section className="fixed inset-0 flex justify-center items-center">
				<div className="p-5 flex flex-col items-center w-full max-w-[520px]">
					<div className="w-full flex flex-col">
						<div className="flex flex-col items-center justify-center gap-1 mb-6">
							<h1 className="text-center text-4xl md:text-5xl font-semibold">
								Iniciar Sessão
							</h1>
							<p className="text-text-muted text-lg md:text-xl">
								Escolha como quer entrar para continuar
							</p>
						</div>

						<PasswordlessLogin
							googleEnabled
							onAuthenticated={onAuthenticated}
							onError={onError}
							footer={
								<div className="text-center pt-1">
									<p className="text-lg text-text-muted">
										Não tem conta?{" "}
										<Link
											href="/signup"
											className="text-primary font-bold hover:underline ml-1"
										>
											Criar Conta
										</Link>
									</p>
								</div>
							}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
