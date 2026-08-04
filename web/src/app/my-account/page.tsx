"use client";

import {
	Bell,
	CreditCard,
	Headset,
	Loader,
	LogOut,
	Mail,
	MoreVertical,
	Phone,
	Receipt,
	Shield,
	User,
	Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccordionSection } from "./components/AccordionSection";
import {
	LicensesSection,
	type LicensesSectionHandle,
} from "./components/LicensesSection";
import { MaintenanceModal } from "./components/MaintenanceModal";
import { NewLicenseModal } from "./components/NewLicenseModal";
import {
	NotificationsSection,
	type NotificationsSectionHandle,
} from "./components/NotificationsSection";
import {
	type Payment,
	PaymentsSection,
	type PaymentsSectionHandle,
} from "./components/PaymentsSection";
import { ProfileSection } from "./components/ProfileSection";
import { ProfilesSection } from "./components/ProfilesSection";

interface UserProfile {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	hasPin: boolean;
}

interface MeResponse {
	user?: UserProfile;
}

export default function MyAccountPage() {
	const router = useRouter();
	const [user, setUser] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [loggingOut, setLoggingOut] = useState(false);

	const [payments, setPayments] = useState<Payment[]>([]);

	const licensesRef = useRef<LicensesSectionHandle>(null);

	const paymentsRef = useRef<PaymentsSectionHandle>(null);
	const notificationsRef = useRef<NotificationsSectionHandle>(null);
	const [plansModalOpen, setPlansModalOpen] = useState(false);
	const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [supportOpen, setSupportOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const supportRef = useRef<HTMLDivElement>(null);
	const fetchUser = useCallback(() => {
		fetch("/api/auth/me")
			.then((r) => {
				if (r.status === 401 || r.status === 404) {
					fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
					router.push("/login");
					return null;
				}
				return r.json();
			})
			.then((data: MeResponse | null) => {
				if (data?.user) {
					setUser({
						firstName: data.user.firstName || "",
						lastName: data.user.lastName || "",
						email: data.user.email || "",
						phone: data.user.phone || "",
						hasPin: !!data.user.hasPin,
					});
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [router]);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
			if (
				supportRef.current &&
				!supportRef.current.contains(e.target as Node)
			) {
				setSupportOpen(false);
			}
		};
		if (menuOpen || supportOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [menuOpen, supportOpen]);

	const scrollToPlans = useCallback(async () => {
		setPlansModalOpen(true);
	}, []);

	const openProfile = useCallback(async () => {}, []);

	const openLicenses = useCallback(async () => {
		await licensesRef.current?.fetchData();
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
				<Loader width={40} className="animate-spin infinite" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto relative">
			<div className="mb-5">
				<h1 className="text-3xl md:text-5xl font-display font-bold text-text text-left capitalize">
					Olá, {`${user?.firstName} ${user?.lastName}`}!
				</h1>
				<p className="text-text-muted mt-1 text-xl md:text-2xl text-left">
					Gerencie os seus dados e assinaturas
				</p>
			</div>
			<div className="flex justify-start">
				<ProfilesSection />
			</div>
			<div className="mt-5">
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

			<NewLicenseModal
				open={plansModalOpen}
				onClose={() => setPlansModalOpen(false)}
			/>

			<div className="flex justify-end gap-3 mt-5">
				<div className="relative" ref={supportRef}>
					<button type="button"
						onClick={() => setSupportOpen((v) => !v)}
						className="font-semibold text-lg md:text-xl px-3 py-2 cursor-pointer hover:text-primary transition-all flex items-center gap-1.5"
					>
						<Headset size={20} />
						Apoio
					</button>
					{supportOpen && (
						<div className="absolute bottom-full right-0 mb-2 bg-surface border border-border shadow-lg min-w-[220px] z-50 animate-slide-up">
							<a
								href="https://wa.me/244926422462"
								target="_blank"
								rel="noopener noreferrer"
								onClick={() => setSupportOpen(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-surface-hover transition-all border-b border-border"
							>
								<svg
									viewBox="0 0 24 24"
									width={18}
									height={18}
									className="shrink-0"
									fill="#25D366"
									aria-hidden="true"
								>
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
								</svg>
								WhatsApp
							</a>
							<a
								href="tel:+244926422462"
								onClick={() => setSupportOpen(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-surface-hover transition-all border-b border-border"
							>
								<Phone size={18} className="text-primary shrink-0" />
								+244 926 422 462
							</a>
							<a
								href="mailto:newstatesofficial@gmail.com"
								onClick={() => setSupportOpen(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-surface-hover transition-all"
							>
								<Mail size={18} className="text-blue-500 shrink-0" />
								newstatesofficial@gmail.com
							</a>
						</div>
					)}
				</div>
				<div className="relative" ref={menuRef}>
					<button type="button"
						onClick={() => setMenuOpen((v) => !v)}
						className="font-semibold text-lg md:text-xl px-3 py-2 cursor-pointer hover:text-primary transition-all flex items-center gap-1.5"
					>
						<MoreVertical size={20} />
						Mais
					</button>
					{menuOpen && (
						<div className="absolute bottom-full right-0 mb-2 bg-surface border border-border shadow-lg min-w-[250px] divide-y divide-gray-700 z-50 animate-slide-up">
							<button type="button"
								onClick={() => {
									setMenuOpen(false);
									setPlansModalOpen(true);
								}}
								className="w-full flex items-center gap-3 px-4 py-3 text-left text-base md:text-lg font-medium text-text hover:bg-surface-hover transition-all"
							>
								<CreditCard size={18} className="text-primary" />
								Obter Licença
							</button>
							<button type="button"
								disabled
								onClick={() => {
									setMenuOpen(false);
									setMaintenanceModalOpen(true);
								}}
								className="w-full flex items-center gap-3 px-4 py-3 text-left text-base md:text-lg font-medium text-text-muted opacity-50 cursor-not-allowed transition-all"
							>
								<Wrench size={18} className="text-text-muted" />
								Solicitar Manutenção
							</button>
							<button type="button"
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
