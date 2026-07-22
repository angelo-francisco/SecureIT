import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Lucide from "lucide-react";
import { useAuth } from "../../hooks";
import { useToast } from "@/packages/ui";
import { Navbar } from "@/components/Navbar";
import { profilesApi, type ProfileData } from "../../api-client/profiles";
import { apiClient } from "../../api-client";
import { Loader } from "@/packages/ui";

export default function ProfileSwitcher() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pinModal, setPinModal] = useState<ProfileData | null>(null);
  
  const getProfiles = () => {
    profilesApi
      .list()
      .then(setProfiles)
      .catch(() => toast("Erro ao carregar perfis", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    getProfiles()
  }, []);


  const handleSelect = async (profile: ProfileData) => {
    if (profile.hasPin) {
      setPinModal(profile);
      return;
    }

    try {
      const result = await profilesApi.select(profile.id);
      if (user?.id) {
        await apiClient.post("/api/control/add-profile", {
          user_id: user.id,
          profile_id: profile.id,
        });
      }
      navigate("/panel", { replace: true });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao selecionar perfil", "error");
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (!pinModal) return;
    try {
      const result = await profilesApi.select(pinModal.id, pin);
      if (user?.id) {
        await apiClient.post("/api/control/add-profile", {
          user_id: user.id,
          profile_id: pinModal.id,
        });
      }
      setPinModal(null);
      navigate("/panel", { replace: true });
    } catch (err) {
      toast(err instanceof Error ? err.message : "PIN incorrecto", "error");
    }
  };

  const handleCreating = () => {
    toast('Aceda o My Account para configurar perfis com segurança')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader w={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="min-h-screen w-full flex items-center justify-center flex-col">
        
      <h1 className="text-text text-4xl font-semibold mb-1">
        Seja bem-vindo, <span className="capitalize">{user?.firstName}!</span>
      </h1>

      <p className="text-text-muted text-2xl text-text mb-8">
        Selecione um dos perfis abaixo para continuar
      </p>

      <div className="flex flex-wrap justify-center gap-6 max-w-3xl">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleSelect(profile)}
            className="cursor-pointer group flex flex-col items-center gap-3 transition-transform hover:scale-105"
          >
            <div className="relative">
              <div
                className="w-32 h-32 flex items-center justify-center text-white text-5xl font-bold transition-all group-hover:ring-4 group-hover:ring-primary/50 group-hover:brightness-110"
                style={{ backgroundColor: profile.avatarColor }}
              >
                {profile.name[0].toUpperCase()}
              </div>
            </div>
            <span className="flex items-center gap-2 text-center text-lg capitalize font-medium text-text-muted group-hover:text-text transition-colors truncate max-w-[128px]">
              {profile.name} {profile.hasPin && (
                  <Lucide.Lock size={16} className="text-text-muted" />
              )}
            </span>
          </button>
        ))}

        <button
          onClick={() => handleCreating()}
          className="cursor-pointer group flex flex-col items-center gap-3 transition-transform hover:scale-105"
        >
          <div className="w-32 h-32 border-2 border-dashed border-border flex items-center justify-center transition-all group-hover:border-primary group-hover:bg-primary/5">
            <Lucide.Plus size={40} className="text-text-muted group-hover:text-primary transition-colors" />
          </div>
          <span className="text-lg font-medium text-text-muted group-hover:text-primary transition-colors">
            Criar Perfil
          </span>
        </button>
      </div>

      {pinModal && (
        <PinEntryModal
          profile={pinModal}
          onComplete={handlePinComplete}
          onClose={() => setPinModal(null)}
        />
      )}
    </div>
      </div>

  );
}


function PinEntryModal({
  profile,
  onComplete,
  onClose,
}: {
  profile: ProfileData;
  onComplete: (pin: string) => void;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "");
    const newPin = pin.slice(0, i) + v + pin.slice(i + 1);
    setPin(newPin);
    setError(false);
    if (v && i < 3) {
      const next = document.getElementById(`pin-entry-${i + 1}`);
      next?.focus();
    }
    if (newPin.length === 4) {
      setTimeout(() => onComplete(newPin), 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-surface border border-border p-8 w-full max-w-md shadow-2xl ${error ? "animate-shake" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center">
          <h3 className="text-2xl font-semibold text-text mb-5 uppercase">insira o código de acesso</h3>
          <div className="flex gap-3 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                id={`pin-entry-${i}`}
                maxLength={1}
                type="password"
                inputMode="numeric"
                placeholder="•"
                value={pin[i] || ""}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !pin[i] && i > 0) {
                    document.getElementById(`pin-entry-${i - 1}`)?.focus();
                  }
                }}
                className={`h-16 w-20 bg-bg border-2 text-center text-text text-lg font-bold focus:outline-none transition-colors caret-primary ${
                  error ? "border-error" : "border-border focus:border-primary"
                }`}
                autoFocus={i === 0}
              />
            ))}
          </div>
          {error && (
            <p className="text-sm text-error">PIN incorrecto</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="cursor-pointer w-full bg-red-500 mt-4 h-12 text-lg text-white font-semibold transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
