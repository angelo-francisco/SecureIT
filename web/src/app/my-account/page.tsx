"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	Shield,
	CreditCard,
	Receipt,
	User,
	LogOut,
	MoreVertical,
	Wrench,
	Bell, Loader
} from "lucide-react";
import { AccordionSection } from "./components/AccordionSection";
import { ProfileSection } from "./components/ProfileSection";
import {
	LicensesSection,
	type LicensesSectionHandle,
} from "./components/LicensesSection";
import {
	PlansSection,
	type PlansSectionHandle,
	type Plan,
} from "./components/PlansSection";
import {
	PaymentsSection,
	type PaymentsSectionHandle,
	type Payment,
} from "./components/PaymentsSection";
import {
	NotificationsSection,
	type NotificationsSectionHandle,
} from "./components/NotificationsSection";
import { ProfilesSection } from "./components/ProfilesSection";
import { MaintenanceModal } from "./components/MaintenanceModal";
import { Modal } from "@/packages/ui";

interface UserProfile {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
}

export default function MyAccountPage() {
	const router = useRouter();
	const [user, setUser] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [loggingOut, setLoggingOut] = useState(false);

	const [plansData, setPlansData] = useState<{
		plans: Plan[];
		paymentInfo: {
			id: string;
			iban: string;
			accountName: string;
			bankName: string | null;
			reference: string | null;
		} | null;
	}>({ plans: [], paymentInfo: null });
	const [payments, setPayments] = useState<Payment[]>([]);

	const licensesRef = useRef<LicensesSectionHandle>(null);
	const plansSectionRef = useRef<PlansSectionHandle>(null);
	const paymentsRef = useRef<PaymentsSectionHandle>(null);
	const notificationsRef = useRef<NotificationsSectionHandle>(null);
	const [plansModalOpen, setPlansModalOpen] = useState(false);
	const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const [paymentInfo, setPaymentInfo] = useState<{
		id: string;
		iban: string;
		accountName: string;
		bankName: string | null;
		reference: string | null;
	} | null>(null);

	useEffect(() => {
		fetchUser();
	}, []);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		};
		if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [menuOpen]);

	const fetchPaymentInfo = async () => {
		try {
			const res = await fetch("/api/payment-info");
			if (res.ok) {
				const data: {
					id: string;
					iban: string;
					accountName: string;
					bankName: string | null;
					reference: string | null;
				} = await res.json();
				setPaymentInfo(data);
			}
		} catch {}
	};

	const fetchUser = () => {
		fetch("/api/auth/me")
			.then((r) => {
				if (r.status === 401 || r.status === 404) {
					document.cookie = "token=; path=/; max-age=0";
					document.cookie = "refresh_token=; path=/; max-age=0";
					router.push("/login");
					return null;
				}
				return r.json();
			})
			.then((data: any) => {
				if (data?.user) {
					setUser({
						firstName: data.user.firstName || "",
						lastName: data.user.lastName || "",
						email: data.user.email || "",
						phone: data.user.phone || "",
					});
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	};

	const scrollToPlans = useCallback(async () => {
		await fetchPaymentInfo();
		setPlansModalOpen(true);
	}, []);

	const openProfile = useCallback(async () => {}, []);

	const openLicenses = useCallback(async () => {
		await licensesRef.current?.fetchData();
	}, []);

	const openPlansModal = useCallback(async () => {
		const [plansRes, infoRes] = await Promise.all([
			fetch("/api/plans"),
			fetch("/api/payment-info"),
		]);
		const p = (plansRes.ok ? await plansRes.json() : []) as any;
		const info = (infoRes.ok ? await infoRes.json() : null) as any;
		setPlansData({ plans: p, paymentInfo: info });
		setPlansModalOpen(true);
	}, []);

	const openPayments = useCallback(async () => {
		const d = await paymentsRef.current?.fetchData();
		if (d) setPayments(d);
	}, []);

	const openNotifications = useCallback(async () => {
		await notificationsRef.current?.fetchData();
	}, []);

	if (loading) {
		return (
			<div className="fixed inset-0 flex items-center justify-center">

				<Loader width={40} className="animate-spin infinite"/>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto">
			<div className="mb-4">
				<h1 className="text-4xl md:text-5xl font-display font-bold text-text text-center md:text-left capitalize">
					Olá, {user?.firstName + " " + user?.lastName}!
				</h1>
				<p className="text-text-muted mt-1 text-xl md:text-2xl text-center md:text-left">
					Gerencie os seus dados e assinaturas
				</p>
			</div>
			<div className="flex justify-center md:justify-start">
				<ProfilesSection />
			</div>
			<div className="mt-4">
				<AccordionSection
					title="Dados Pessoais"
					icon={User}
					onOpen={openProfile}
				>
					{user && <ProfileSection user={user} onSaved={fetchUser} />}
				</AccordionSection>

				<AccordionSection title="Licença" icon={Shield} onOpen={openLicenses}>
					<LicensesSection
						ref={licensesRef}
						data={null}
						onNavigateToPlans={scrollToPlans}
					/>
				</AccordionSection>

				<AccordionSection
					title="Pagamentos"
					icon={Receipt}
					onOpen={openPayments}
				>
					<PaymentsSection ref={paymentsRef} data={payments} />
				</AccordionSection>

				<AccordionSection
					title="Notificações"
					icon={Bell}
					onOpen={openNotifications}
				>
					<NotificationsSection ref={notificationsRef} data={null} />
				</AccordionSection>
			</div>

			<MaintenanceModal
				open={maintenanceModalOpen}
				onClose={() => setMaintenanceModalOpen(false)}
			/>

			<Modal
				open={plansModalOpen}
				disableBackdropClose
				className="w-full max-w-5xl mx-4"
			>
				<div className="bg-surface border border-border p-6 max-h-[85vh] overflow-y-auto">
					<div className="flex items-center justify-center gap-2.5 mb-5">
						<h2 className="text-xl md:text-2xl font-display font-bold text-text">
							Planos e Pagamentos
						</h2>
					</div>
					<PlansSection
						ref={plansSectionRef}
						data={plansData}
						onClose={() => setPlansModalOpen(false)}
					/>
				</div>
			</Modal>

			<div className="flex justify-end gap-3 mt-5">
				<div className="relative" ref={menuRef}>
					<button
						onClick={() => setMenuOpen((v) => !v)}
						className="font-semibold text-lg md:text-xl px-3 py-2 cursor-pointer hover:text-primary transition-all flex items-center gap-1.5"
					>
						<MoreVertical size={20} />
						Mais
					</button>
					{menuOpen && (
						<div className="absolute bottom-full right-0 mb-2 bg-surface border border-border shadow-lg min-w-[250px] divide-y divide-gray-700 z-50 animate-slide-up">
							<button
								onClick={() => {
									setMenuOpen(false);
									openPlansModal();
								}}
								className="w-full flex items-center gap-3 px-4 py-3 text-left text-base md:text-lg font-medium text-text hover:bg-surface-hover transition-all"
							>
								<CreditCard size={18} className="text-primary" />
								Planos e Pagamentos
							</button>
							<button
								onClick={async () => {
									setMenuOpen(false);
									await fetchPaymentInfo();
									setMaintenanceModalOpen(true);
								}}
								className="w-full flex items-center gap-3 px-4 py-3 text-left text-base md:text-lg font-medium text-text hover:bg-surface-hover transition-all"
							>
								<Wrench size={18} className="text-primary" />
								Solicitar Manutenção
							</button>
							<button
								onClick={async () => {
									setLoggingOut(true);
									await fetch("/api/auth/logout", { method: "POST" });
									router.push("/login");
								}}
								disabled={loggingOut}
								className="w-full flex items-center gap-3 px-4 py-3 text-left text-base md:text-lg font-medium text-text hover:bg-surface-hover transition-all"
							>
								{loggingOut ? (
									<Loader width={16} className="animate-spin infinite" />
								) : (
									<LogOut size={18} className="text-red-500" />
								)}
								Fechar Sessão
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
