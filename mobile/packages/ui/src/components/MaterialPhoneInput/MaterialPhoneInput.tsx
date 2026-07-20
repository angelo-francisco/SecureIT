"use client";

import { useState } from "react";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { cn } from "../../lib/cn";

interface MaterialPhoneInputProps {
  value?: string;
  onChange?: (value?: string) => void;
  error?: boolean;
  label?: string;
}

export function MaterialPhoneInput({ value, onChange, error, label = "Telemóvel" }: MaterialPhoneInputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = !!value;
  const labelUp = focused || hasValue;

  return (
    <div className="relative">
      <label
        className={cn(
          "absolute pointer-events-none transition-all duration-200 select-none z-10 -top-0.5 left-0 text-xs",
          error
            ? "text-error"
            : labelUp
              ? "text-primary"
              : "text-text-muted"
        )}
      >
        {label}
      </label>
      <div
        className={cn(
          "phone-input-wrapper flex items-end h-14 border-b-2 transition-colors pt-4",
          error ? "border-error" : focused ? "border-primary" : "border-border"
        )}
      >
        <PhoneInput
          international
          defaultCountry="PT"
          value={value}
          onChange={onChange as (value?: string) => void}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          countrySelectComponent={CountrySelect}
        />
      </div>
    </div>
  );
}

/* ---------- Country selector ---------- */

const COUNTRIES = [
  { code: "PT", label: "Portugal", dialCode: "+351" },
  { code: "BR", label: "Brasil", dialCode: "+55" },
  { code: "US", label: "Estados Unidos", dialCode: "+1" },
  { code: "GB", label: "Reino Unido", dialCode: "+44" },
  { code: "FR", label: "França", dialCode: "+33" },
  { code: "DE", label: "Alemanha", dialCode: "+49" },
  { code: "ES", label: "Espanha", dialCode: "+34" },
  { code: "IT", label: "Itália", dialCode: "+39" },
  { code: "NL", label: "Países Baixos", dialCode: "+31" },
  { code: "BE", label: "Bélgica", dialCode: "+32" },
  { code: "CH", label: "Suíça", dialCode: "+41" },
  { code: "AT", label: "Áustria", dialCode: "+43" },
  { code: "PL", label: "Polónia", dialCode: "+48" },
  { code: "SE", label: "Suécia", dialCode: "+46" },
  { code: "NO", label: "Noruega", dialCode: "+47" },
  { code: "DK", label: "Dinamarca", dialCode: "+45" },
  { code: "FI", label: "Finlândia", dialCode: "+358" },
  { code: "IE", label: "Irlanda", dialCode: "+353" },
  { code: "CA", label: "Canadá", dialCode: "+1" },
  { code: "AU", label: "Austrália", dialCode: "+61" },
  { code: "JP", label: "Japão", dialCode: "+81" },
  { code: "CN", label: "China", dialCode: "+86" },
  { code: "IN", label: "Índia", dialCode: "+91" },
  { code: "ZA", label: "África do Sul", dialCode: "+27" },
  { code: "AO", label: "Angola", dialCode: "+244" },
  { code: "MZ", label: "Moçambique", dialCode: "+258" },
  { code: "CV", label: "Cabo Verde", dialCode: "+238" },
  { code: "GW", label: "Guiné-Bissau", dialCode: "+245" },
  { code: "ST", label: "São Tomé e Príncipe", dialCode: "+239" },
  { code: "TL", label: "Timor-Leste", dialCode: "+670" },
] as const;

function CountrySelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  const country = COUNTRIES.find((c) => c.code === value) ?? COUNTRIES[0];
  const Flag = flags[value as keyof typeof flags];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-1 pb-1 h-full text-text hover:bg-surface-hover transition-colors rounded-l"
      >
        {Flag && <span className="inline-flex w-5 h-4 shrink-0 overflow-hidden"><Flag title={country.label} /></span>}
        <svg className={cn("w-3 h-3 text-text-muted transition-transform shrink-0", open && "rotate-180")} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 4.5L6 8.5L10 4.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-64 max-h-64 overflow-y-auto bg-surface border border-border rounded-lg shadow-xl z-50 scrollbar-thin">
          {COUNTRIES.map((c) => {
            const F = flags[c.code as keyof typeof flags];
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-hover transition-colors text-left",
                  value === c.code && "bg-primary/10 text-primary"
                )}
              >
                {F && <span className="inline-flex w-5 h-4 shrink-0 overflow-hidden"><F title={c.label} /></span>}
                <span className="flex-1 text-text">{c.label}</span>
                <span className="text-text-muted text-xs">{c.dialCode}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
