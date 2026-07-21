"use client";

import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Key, Shield, Clock, Monitor } from "lucide-react";

export interface LicenseData {
  id: string;
  activatedAt: string;
  expiresAt: string;
  machineHash: string | null;
  key: {
    key: string;
    type: string;
    durationDays: number;
  };
}

interface LicensesSectionProps {
  data: LicenseData | null;
  onNavigateToPlans?: () => void;
}

export interface LicensesSectionHandle {
  fetchData: () => Promise<LicenseData | null>;
}

export const LicensesSection = forwardRef<LicensesSectionHandle, LicensesSectionProps>(
  ({ data, onNavigateToPlans }, ref) => {
    const [license, setLicense] = useState<LicenseData | null>(data);

    useImperativeHandle(ref, () => ({
      fetchData: async () => {
        const res = await fetch("/api/my-account/license");
        if (res.ok) {
          const d = await res.json();
          setLicense(d);
          return d;
        }
        return null;
      },
    }));

    const isActive = license ? new Date(license.expiresAt) > new Date() : false;

    if (!license) {
      return (
        <div className="text-center py-8 text-text-muted">
          <Key size={40} className="mx-auto mb-3 opacity-50" />
          <p className="mb-3">Não tem nenhuma licença ativa</p>
          {onNavigateToPlans && (
            <button
              onClick={onNavigateToPlans}
              className="text-primary font-bold hover:underline text-sm"
            >
              Ver planos disponíveis →
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4 max-w-xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl ${
              isActive ? "bg-success/15" : "bg-error/15"
            } flex items-center justify-center`}
          >
            <Shield
              size={22}
              className={isActive ? "text-success" : "text-error"}
            />
          </div>
          <div>
            <h3 className="font-semibold text-text">
              Licença {isActive ? "Ativa" : "Expirada"}
            </h3>
            <p
              className={`text-sm font-medium ${
                isActive ? "text-success" : "text-error"
              }`}
            >
              {isActive ? "Ativa" : "Expirada"}
            </p>
          </div>
        </div>

        <div className="space-y-0">
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <span className="text-sm text-text-muted flex items-center gap-2">
              <Key size={14} /> Chave
            </span>
            <span className="text-sm font-mono font-medium text-text">
              {license.key.key}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <span className="text-sm text-text-muted">Tipo</span>
            <span className="text-sm font-medium text-text">
              {license.key.type}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <span className="text-sm text-text-muted flex items-center gap-2">
              <Clock size={14} /> Duração
            </span>
            <span className="text-sm font-medium text-text">
              {license.key.durationDays} dias
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <span className="text-sm text-text-muted">Ativada em</span>
            <span className="text-sm font-medium text-text">
              {new Date(license.activatedAt).toLocaleDateString("pt-PT")}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <span className="text-sm text-text-muted">Expira em</span>
            <span className="text-sm font-medium text-text">
              {new Date(license.expiresAt).toLocaleDateString("pt-PT")}
            </span>
          </div>
          {license.machineHash && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Monitor size={14} /> Máquina
              </span>
              <span className="text-xs font-mono text-text-muted truncate max-w-[200px]">
                {license.machineHash}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

LicensesSection.displayName = "LicensesSection";
