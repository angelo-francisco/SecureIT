"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Receipt } from "lucide-react";

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
				const d = (await res.json()) as any;
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
			? "text-success bg-success/10"
			: s === "REJECTED"
				? "text-error bg-error/10"
				: "text-warning bg-warning/10";

	if (payments.length === 0) {
		return (
			<div className="text-center py-8 text-text-muted">
				<Receipt size={40} className="mx-auto mb-3 opacity-50" />
				<p>Ainda não submeteu nenhum pagamento</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="border-b border-border">
						<th className="text-center py-4 text-base md:text-lg font-semibold text-text">
							Nome
						</th>
						<th className="text-center py-4 text-base md:text-lg font-semibold text-text">
							Montante
						</th>
						<th className="text-center py-4 text-base md:text-lg font-semibold text-text">
							Data
						</th>
						<th className="text-center py-4 text-base md:text-lg font-semibold text-text">
							Estado
						</th>
						<th className="text-center py-4 text-base md:text-lg font-semibold text-text">
							Outros
						</th>
					</tr>
				</thead>

				<tbody>
					{payments.map((p) => (
						<tr
							key={p.id}
							className="border-b border-border/50 last:border-b-0 hover:bg-card/40 transition-colors"
						>
							<td className="text-center py-4">
								<p className="text-lg md:text-xl font-semibold text-text whitespace-nowrap">
									{p.plan.name}
								</p>
							</td>

							<td className="text-center py-4">
								<p className="text-lg md:text-xl font-medium text-text whitespace-nowrap">
									${(p.totalPrice || p.plan.basePrice).toFixed(2)}
								</p>
							</td>

							<td className="text-center py-4">
								<p className="text-base md:text-lg text-text-muted whitespace-nowrap">
									{new Date(p.createdAt).toLocaleDateString("pt-PT")}
								</p>
							</td>

							<td className="text-center py-4 whitespace-nowrap">
								<span
									className={`inline-flex px-3 py-1 rounded-full text-sm md:text-base font-medium ${statusColor(
										p.status,
									)}`}
								>
									{statusLabel(p.status)}
								</span>
							</td>

							<td className="text-center py-4 min-w-[220px]">
								<div className="flex flex-col gap-2">
									{p.proofUrl && (
										<a
											href={p.proofUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-base font-medium text-primary hover:underline"
										>
											Ver comprovativo
										</a>
									)}

									{p.adminNote && (
										<p className="text-sm md:text-base italic text-text-muted">
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
