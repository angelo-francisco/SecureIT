"use client";

import { Receipt } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";

export interface Payment {
	id: string;
	status: string;
	proofUrl: string | null;
	adminNote: string | null;
	totalPrice: number | null;
	createdAt: string;
	plan: {
		name: string;
		basePrice: number;
	};
}

interface PaymentsSectionProps {
	data: Payment[];
}

export interface PaymentsSectionHandle {
	fetchData: () => Promise<Payment[]>;
}

export const PaymentsSection = forwardRef<
	PaymentsSectionHandle,
	PaymentsSectionProps
>(({ data: initialData }, ref) => {
	const [payments, setPayments] = useState<Payment[]>(initialData);

	useImperativeHandle(ref, () => ({
		fetchData: async () => {
			const res = await fetch("/api/payments");
			if (res.ok) {
				const d = (await res.json()) as Payment[];
				const arr = Array.isArray(d) ? d : [];
				setPayments(arr);
				return arr;
			}
			return [];
		},
	}));

	const statusLabel = (s: string) =>
		s === "APPROVED" ? "Aprovado" : s === "REJECTED" ? "Rejeitado" : "Pendente";

	const statusColor = (s: string) =>
		s === "APPROVED"
			? "text-success bg-success/10 border-success/30"
			: s === "REJECTED"
				? "text-error bg-error/10 border-error/30"
				: "text-warning bg-warning/10 border-warning/30";

	if (payments.length === 0) {
		return (
			<div className="text-center py-8 text-text-muted">
				<Receipt size={36} className="mx-auto mb-3 opacity-40 text-primary" />
				<p className="text-base font-medium">
					Ainda não submeteu nenhum pagamento
				</p>
			</div>
		);
	}

	return (
		<div className="  bg-surface/50">
			<table className="w-full text-left">
				<thead>
					<tr className="border-b border-border bg-surface">
						<th className="py-3 px-4 text-base font-bold uppercase text-center text-text-muted">
							Plano
						</th>
						<th className="py-3 px-4 text-base font-bold uppercase text-center text-text-muted">
							Montante
						</th>
						<th className="py-3 px-4 text-base font-bold uppercase text-center text-text-muted">
							Data
						</th>
						<th className="py-3 px-4 text-base font-bold uppercase text-center text-text-muted">
							Estado
						</th>
						<th className="py-3 px-4 text-base font-bold uppercase text-center text-text-muted"></th>
					</tr>
				</thead>

				<tbody className="divide-y divide-border/60">
					{payments.map((p) => (
						<tr
							key={p.id}
							className="hover:bg-surface-hover/60 transition-colors text-base"
						>
							<td className="py-3.5 px-4 font-bold text-text text-center">
								{p.plan.name}
							</td>

							<td className="py-3.5 px-4 font-semibold text-text  text-center">
								${(p.totalPrice || p.plan.basePrice).toFixed(2)}
							</td>

							<td className="py-3.5 px-4 text-base text-text  text-center">
								{new Date(p.createdAt).toLocaleDateString("pt-PT")}
							</td>

							<td className="py-3.5 px-4 whitespace-nowrap  text-center">
								<span
									className={`inline-flex px-2 py-0.5 text-base font-bold uppercase text-center ${statusColor(
										p.status,
									)}`}
								>
									{statusLabel(p.status)}
								</span>
							</td>

							<td className="text-center">
								<div className="flex flex-row gap-2">
									{p.proofUrl && (
										<a
											href={p.proofUrl.replace(
												"/upload/",
												"/upload/fl_attachment/",
											)}
											className="text-primary hover:underline"
											download="recibo.jpg"
										>
											Recibo
										</a>
									)}

									<button
										type="button"
										rel="noopener noreferrer"
										className="line-through text-text-muted cursor-default"
									>
										Detalhes
									</button>

									{p.adminNote && (
										<p className="text-base italic text-text-muted">
											Nota: {p.adminNote}
										</p>
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
});

PaymentsSection.displayName = "PaymentsSection";
