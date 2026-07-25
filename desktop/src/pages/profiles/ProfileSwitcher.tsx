import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Lucide from "lucide-react";
import { useAuth } from "../../hooks";
import { useToast, PinInput, Loader } from "@/packages/ui";
import { Navbar } from "@/components/Navbar";
import { profilesApi, type ProfileData } from "../../api-client/profiles";
import { apiClient } from "../../api-client";

export default function ProfileSwitcher() {
  const navigate = useNavigate();
  const { user, selectProfile } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinModal, setPinModal] = useState<ProfileData | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

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

    setSelectingId(profile.id);
    try {
      const result = await profilesApi.select(profile.id);
      selectProfile(result);
      if (user?.id) {
        await apiClient.post("/api/control/add-profile", {
          user_id: user.id,
          profile_id: profile.id,
        });
      }
      navigate("/panel", { replace: true });
    } catch (err) {
      setSelectingId(null);
      toast(err instanceof Error ? err.message : "Erro ao selecionar perfil", "error");
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (!pinModal) return;
    setSelectingId(pinModal.id);
    try {
      const result = await profilesApi.select(pinModal.id, pin);
      selectProfile(result);
      if (user?.id) {
        await apiClient.post("/api/control/add-profile", {
          user_id: user.id,
          profile_id: pinModal.id,
        });
      }
      setPinModal(null);
      navigate("/panel", { replace: true });
    } catch (err) {
      setSelectingId(null);
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
        {profiles.map((profile) => {
          const isSelecting = selectingId === profile.id;
          return (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile)}
              disabled={!!selectingId}
              className="cursor-pointer group flex flex-col items-center gap-3 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
              <div className="relative">
                <div
                  className="w-32 h-32 flex items-center justify-center text-white text-5xl font-bold transition-all group-hover:ring-4 group-hover:ring-primary/50 group-hover:brightness-110"
                  style={{ backgroundColor: profile.avatarColor }}
                >
                  {isSelecting ? (
                    <Loader w={40} />
                  ) : (
                    profile.name[0].toUpperCase()
                  )}
                </div>
              </div>
              <span className="flex items-center gap-2 text-center text-lg capitalize font-medium text-text-muted group-hover:text-text transition-colors truncate max-w-[128px]">
                {profile.name} {profile.hasPin && (
                    <Lucide.Lock size={16} className="text-text-muted" />
                )}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => handleCreating()}
          disabled={!!selectingId}
          className="cursor-pointer group flex flex-col items-center gap-3 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
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
  const { toast } = useToast()

  const handleOnComplete = () => {
    if (pin.length === 4) {
      onComplete(pin);
    } else {
      setError("Digite o PIN [4 DÍGITOS]")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs" onClick={onClose}>
      <div
        className={`bg-surface border border-border p-8 w-full max-w-md shadow-2xl ${error ? "animate-shake" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={() => setTimeout(() => setError(false),5000)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-text uppercase">código de acesso</h3>
          <button
            onClick={onClose}
            className="cursor-pointer border border-border flex justify-center items-center text-center p-1 text-white font-semibold transition-colors"
          >
            <Lucide.X size={16}/>
          </button>
        </div>  
        <div className="flex gap-3 items-center mt-8">
          <PinInput
            value={pin}
            onChange={(v) => { setPin(v); setError(false); }}
            autoFocus
          />
          
          <button
            onClick={handleOnComplete}
            className="cursor-pointer w-full p-4 bg-primary flex justify-center text-lg text-white font-semibold transition-colors"
          >
            <Lucide.ArrowRight />
          </button>
        </div>
        {error && (
          <p className="text-error mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
