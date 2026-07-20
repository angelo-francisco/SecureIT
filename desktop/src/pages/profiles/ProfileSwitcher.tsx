import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Lucide from "lucide-react";
import { useAuth } from "../../hooks";
import { useToast } from "../../hooks/useToast";
import { profilesApi, type ProfileData } from "../../api-client/profiles";
import { FullLogo, Loader } from "@/packages/ui";

export default function ProfileSwitcher() {
  const navigate = useNavigate();
  const { selectProfile, selectedProfile, user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pinModal, setPinModal] = useState<ProfileData | null>(null);

  useEffect(() => {
    profilesApi
      .list()
      .then(setProfiles)
      .catch(() => toast("Erro ao carregar perfis", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      navigate("/panel", { replace: true });
    }
  }, [selectedProfile, navigate]);

  const handleSelect = async (profile: ProfileData) => {
    if (profile.hasPin) {
      setPinModal(profile);
      return;
    }
    try {
      const result = await profilesApi.select(profile.id);
      selectProfile(result);
      navigate("/panel", { replace: true });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao selecionar perfil", "error");
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (!pinModal) return;
    try {
      const result = await profilesApi.select(pinModal.id, pin);
      selectProfile(result);
      setPinModal(null);
      navigate("/panel", { replace: true });
    } catch (err) {
      toast(err instanceof Error ? err.message : "PIN incorrecto", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader w={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4">
      <FullLogo className="h-16 mb-2" />
      <p className="text-text-muted text-lg mb-12">
        Bem-vindo, {user?.firstName}
      </p>

      <h2 className="text-2xl font-display font-bold text-text mb-8">
        Quem está a ver?
      </h2>

      <div className="flex flex-wrap justify-center gap-6 max-w-3xl">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleSelect(profile)}
            className="group flex flex-col items-center gap-3 transition-transform hover:scale-105"
          >
            <div className="relative">
              <div
                className="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-4xl font-bold transition-all group-hover:ring-4 group-hover:ring-primary/50 group-hover:brightness-110"
                style={{ backgroundColor: profile.avatarColor }}
              >
                {profile.name[0].toUpperCase()}
              </div>
              {profile.hasPin && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-bg border-2 border-surface flex items-center justify-center">
                  <Lucide.Lock size={12} className="text-text-muted" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-text-muted group-hover:text-text transition-colors truncate max-w-[128px]">
              {profile.name}
            </span>
          </button>
        ))}

        <button
          onClick={() => setCreating(true)}
          className="group flex flex-col items-center gap-3 transition-transform hover:scale-105"
        >
          <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-border flex items-center justify-center transition-all group-hover:border-primary group-hover:bg-primary/5">
            <Lucide.Plus size={36} className="text-text-muted group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-text-muted group-hover:text-primary transition-colors">
            Criar Perfil
          </span>
        </button>
      </div>

      {creating && (
        <CreateProfileModal
          onClose={() => setCreating(false)}
          onCreated={(p) => {
            setProfiles([...profiles, p]);
            setCreating(false);
          }}
        />
      )}

      {pinModal && (
        <PinEntryModal
          profile={pinModal}
          onComplete={handlePinComplete}
          onClose={() => setPinModal(null)}
        />
      )}
    </div>
  );
}

function CreateProfileModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: ProfileData) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"name" | "pin">("name");

  const COLORS = ["#2C9ED5", "#E04F5D", "#6C5CE7", "#00B894", "#FDCB6E", "#E17055", "#0984E3", "#A29BFE"];
  const [color] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const p = await profilesApi.create({
        name: name.trim(),
        avatarColor: color,
        pin: pin || undefined,
      });
      onCreated(p);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao criar perfil", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "name" ? (
          <>
            <h3 className="text-xl font-display font-bold text-text mb-6">Criar Perfil</h3>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ backgroundColor: color }}
              >
                {name ? name[0].toUpperCase() : "?"}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Nome do perfil"
                autoFocus
                className="flex-1 h-12 px-4 bg-bg border border-border rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-colors"
                onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep("pin")}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-12 rounded-lg border border-border text-text-muted font-medium hover:bg-surface-hover transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => name.trim() && setStep("pin")}
                disabled={!name.trim()}
                className="flex-1 h-12 rounded-lg bg-primary text-white font-medium hover:brightness-110 transition-all disabled:opacity-50"
              >
                Avançar
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-display font-bold text-text mb-2">Definir PIN</h3>
            <p className="text-sm text-text-muted mb-6">
              O PIN protege o perfil <span className="text-text font-medium">{name}</span>
            </p>
            <div className="flex gap-3 justify-center mb-6">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  maxLength={1}
                  type="password"
                  inputMode="numeric"
                  placeholder="•"
                  value={pin[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const newPin = pin.slice(0, i) + val + pin.slice(i + 1);
                    setPin(newPin);
                    if (val && i < 3) {
                      const next = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                      next?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !pin[i] && i > 0) {
                      const prev = e.target.parentElement?.children[i - 1] as HTMLInputElement;
                      prev?.focus();
                    }
                  }}
                  className="h-14 w-14 bg-bg border border-border rounded-lg text-center text-text text-lg font-bold focus:border-primary focus:outline-none transition-colors caret-primary"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <p className="text-xs text-text-muted text-center mb-6">
              Opcional — pode deixar vazio para acesso sem PIN
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("name")}
                className="flex-1 h-12 rounded-lg border border-border text-text-muted font-medium hover:bg-surface-hover transition-all"
              >
                Voltar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 h-12 rounded-lg bg-primary text-white font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader size={16} /> : "Criar Perfil"}
              </button>
            </div>
          </>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl ${error ? "animate-shake" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4"
            style={{ backgroundColor: profile.avatarColor }}
          >
            {profile.name[0].toUpperCase()}
          </div>
          <h3 className="text-lg font-display font-bold text-text mb-1">{profile.name}</h3>
          <p className="text-sm text-text-muted mb-6">Insira o PIN para continuar</p>
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
                className={`h-14 w-14 bg-bg border-2 rounded-lg text-center text-text text-lg font-bold focus:outline-none transition-colors caret-primary ${
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
          className="w-full mt-4 h-10 rounded-lg text-sm text-text-muted hover:text-text transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
