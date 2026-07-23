"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, CreditCard, Receipt, User } from "lucide-react";
import { Loader } from "@/packages/ui";
import { AccordionSection } from "./components/AccordionSection";
import { ProfileSection } from "./components/ProfileSection";
import {
  LicensesSection,
  type LicensesSectionHandle,
  type LicenseData,
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
  ProfilesSection,
} from "./components/ProfilesSection";
import { NewLicenseModal } from "./components/NewLicenseModal";

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
  const plansRef = useRef<HTMLDivElement>(null);

  const [licenses, setLicenses] = useState<LicenseData | null>(null);
  const [plansData, setPlansData] = useState<{
    plans: Plan[];
    paymentInfo: { id: string; iban: string; accountName: string; bankName: string | null } | null;
  }>({ plans: [], paymentInfo: null });
  const [payments, setPayments] = useState<Payment[]>([]);

  const licensesRef = useRef<LicensesSectionHandle>(null);
  const plansSectionRef = useRef<PlansSectionHandle>(null);
  const paymentsRef = useRef<PaymentsSectionHandle>(null);
  const [newLicenseModalOpen, setNewLicenseModalOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = () => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null) as any)
      .then((data) => {
        if (data?.user) {
          setUser({
            firstName: data.user.firstName || "",
            lastName: data.user.lastName || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
          });
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  const scrollToPlans = useCallback(() => {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const openProfile = useCallback(async () => {}, []);

  const openLicenses = useCallback(async () => {
    const d = await licensesRef.current?.fetchData();
    if (d) setLicenses(d);
  }, []);

  const openPlans = useCallback(async () => {
    const d = await plansSectionRef.current?.fetchData();
    if (d) setPlansData(d);
  }, []);

  const openPayments = useCallback(async () => {
    const d = await paymentsRef.current?.fetchData();
    if (d) setPayments(d);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader w={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-text capitalize">
          Olá, {user?.firstName + " " + user?.lastName}!
        </h1>
        <p className="text-text-muted mt-1 text-xl md:text-2xl">
          Gerencie os seus dados e assinaturas
        </p>
      </div>

      <ProfilesSection />
      <div className="mt-4">
      <AccordionSection title="Dados Pessoais" icon={User} onOpen={openProfile}>
        {user && <ProfileSection user={user} onSaved={fetchUser} />}
      </AccordionSection>

      <AccordionSection title="Licenças" icon={Shield} onOpen={openLicenses}>
        <LicensesSection ref={licensesRef} data={licenses} onNavigateToPlans={scrollToPlans} onNewLicense={() => setNewLicenseModalOpen(true)} />
      </AccordionSection>

      <div ref={plansRef}>
        <AccordionSection title="Planos" icon={CreditCard} onOpen={openPlans}>
          <PlansSection ref={plansSectionRef} data={plansData} />
        </AccordionSection>
      </div>

      <AccordionSection title="Pagamentos" icon={Receipt} onOpen={openPayments}>
        <PaymentsSection ref={paymentsRef} data={payments} />
      </AccordionSection>
    </div>

      <NewLicenseModal
        open={newLicenseModalOpen}
        onClose={() => setNewLicenseModalOpen(false)}
        onComplete={openLicenses}
      />

      <div className="flex justify-end mt-5">
        <button
          onClick={async () => {
            setLoggingOut(true);
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
          disabled={loggingOut}
          className="font-semibold bg-red-500 text-lg md:text-xl px-3 py-1 border cursor-pointer hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loggingOut && <Loader w={16} />}
          Fechar Sessão
        </button>
      </div>
    </div>

  );
}
