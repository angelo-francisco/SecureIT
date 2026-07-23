import type { ReactNode } from "react";
import { useAuthStore } from "../hooks";
import { useLicenseGuard, type LicenseGuardStatus } from "../hooks/useLicenseGuard";
import LicensePage from "../pages/panel/LicensePage";
import * as Lucide from "lucide-react";

function LicenseBlockScreen({ reason }: { reason: LicenseGuardStatus }) {
  const messages: Record<string, { title: string; description: string; icon: ReactNode }> = {
    expired: {
      title: "Licença Expirada",
      description: "A sua licença expirou. Insira uma nova chave de licença para continuar.",
      icon: <Lucide.Clock size={48} className="text-red-400" />,
    },
    revoked: {
      title: "Licença Revogada",
      description: "A sua licença foi revogada. Contacte o suporte para mais informações.",
      icon: <Lucide.Ban size={48} className="text-red-400" />,
    },
    stale: {
      title: "Conexão Necessária",
      description: "A licença precisa de ser validada online. Ligue-se à internet e tente novamente.",
      icon: <Lucide.WifiOff size={48} className="text-amber-400" />,
    },
    fingerprint_mismatch: {
      title: "Máquina Não Reconhecida",
      description: "Esta licença não está activa nesta máquina. Contacte o suporte.",
      icon: <Lucide.MonitorX size={48} className="text-red-400" />,
    },
    invalid_signature: {
      title: "Licença Inválida",
      description: "Os dados da licença foram alterados. Insira uma nova chave.",
      icon: <Lucide.ShieldAlert size={48} className="text-red-400" />,
    },
    error: {
      title: "Erro de Verificação",
      description: "Não foi possível verificar a licença. Verifique a ligação à internet.",
      icon: <Lucide.AlertTriangle size={48} className="text-amber-400" />,
    },
  };

  const info = messages[reason] || messages.error;

  return (
    <div className="flex-1 h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">{info.icon}</div>
        <h2 className="text-xl font-bold text-white mb-2">{info.title}</h2>
        <p className="text-gray-400 text-sm">{info.description}</p>
      </div>
    </div>
  );
}

interface LicenseGuardProps {
  children: ReactNode;
}

export function LicenseGuard({ children }: LicenseGuardProps) {
  const user = useAuthStore((s) => s.user);
  const { status } = useLicenseGuard(user?.id ?? null);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Lucide.Loader size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (status === "valid") {
    return <>{children}</>;
  }

  if (status === "no_license") {
    return <LicensePage />;
  }

  return <LicenseBlockScreen reason={status} />;
}
