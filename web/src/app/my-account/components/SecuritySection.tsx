"use client";

import { Check, Mail, ShieldCheck } from "lucide-react";

interface SecuritySectionProps {
	totpEnabled: boolean;
	email2faEnabled: boolean;
}

export function SecuritySection({
	totpEnabled,
	email2faEnabled,
}: SecuritySectionProps) {
	return (
		<div className="space-y-5">
			<p className="text-lg text-text">
				A verificação em duas etapas é obrigatória. O autenticador permite
				entrar com o código gerado pela sua aplicação (Google Authenticator,
				Authy, etc.) e a verificação por e-mail reforça o acesso por
				palavra-passe.
			</p>

			<div className="relative flex items-center justify-between gap-4 border border-border bg-surface p-4">
				<div className="flex items-center gap-3">
					<ShieldCheck
						size={22}
						className={
							totpEnabled ? "text-primary shrink-0" : "text-text-muted shrink-0"
						}
					/>
					<div>
						<div className="text-base font-semibold text-text">
							Autenticador {totpEnabled ? "ativo" : "não configurado"}
						</div>
						<div className="text-sm text-text-muted">
							{totpEnabled
								? "O código é exigido para entrar na conta."
								: "O autenticador deve ser configurado antes de aceder à conta."}
						</div>
					</div>
					{totpEnabled && (
						<Check
							size={18}
							className="absolute right-4 text-primary shrink-0"
						/>
					)}
				</div>
			</div>

			<div className="relative flex items-center justify-between gap-4 border border-border bg-surface p-4">
				<div className="flex items-center gap-3">
					<Mail
						size={22}
						className={
							email2faEnabled
								? "text-primary shrink-0"
								: "text-text-muted shrink-0"
						}
					/>
					<div>
						<div className="text-base font-semibold text-text">
							Verificação por e-mail{" "}
							{email2faEnabled ? "ativa" : "não configurada"}
						</div>
						<div className="text-sm text-text-muted">
							{email2faEnabled
								? "Um código de segurança é enviado para o seu e-mail."
								: "A verificação por e-mail deve ser configurada antes de aceder à conta."}
						</div>
					</div>
					{email2faEnabled && (
						<Check
							size={18}
							className="absolute right-4 text-primary shrink-0"
						/>
					)}
				</div>
			</div>
		</div>
	);
}
