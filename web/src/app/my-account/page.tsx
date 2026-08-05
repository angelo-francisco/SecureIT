"use client";

import { Loader, Receipt, Shield, User } from "lucide-react";
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
	const [payments, setPayments] = useState<Payment[]>([]);

	const licensesRef = useRef<LicensesSectionHandle>(null);
	const paymentsRef = useRef<PaymentsSectionHandle>(null);

	const [plansModalOpen, setPlansModalOpen] = useState(false);
	const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

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
		const handleOpenPlans = () => setPlansModalOpen(true);
		window.addEventListener("open-plans-modal", handleOpenPlans);

		return () => {
			window.removeEventListener("open-plans-modal", handleOpenPlans);
		};
	}, []);

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

	if (loading) {
		return (
			<div className="fixed inset-0 flex items-center justify-center">
				<Loader width={40} className="animate-spin infinite" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto relative pb-12">
			<div className="mb-6">
				<h1 className="text-2xl sm:text-4xl font-display font-bold text-text tracking-tight">
					Olá, {`${user?.firstName} ${user?.lastName}`}
				</h1>
				<p className="text-text-muted mt-1 text-sm sm:text-base">
					Gerencie os seus dados pessoais, perfis e assinaturas ativas.
				</p>
			</div>
			<div className="flex justify-start">
				<ProfilesSection />
			</div>
			<div className="mt-6 space-y-4">
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
			</div>

			<MaintenanceModal
				open={maintenanceModalOpen}
				onClose={() => setMaintenanceModalOpen(false)}
			/>

			<NewLicenseModal
				open={plansModalOpen}
				onClose={() => setPlansModalOpen(false)}
			/>
		</div>
	);
}
