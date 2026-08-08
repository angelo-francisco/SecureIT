import { useLicenseStore } from "../stores/license";

export function useLicense() {
  const store = useLicenseStore();

  const hasLicense = store.licenseId !== null;
	const isB2C = store.type === "B2C";
	const isB2B = store.type === "B2B";

  const maxCameras = store.maxCameras === -1 ? Infinity : store.maxCameras;
  const maxPeople = store.maxPeople === -1 ? Infinity : store.maxPeople;

  const FEATURE_ALIASES: Record<string, string[]> = {
    face_recognition: ["face_recognition", "reconhecimento_facial", "facial_recognition"],
    analise_comportamental: ["analise_comportamental", "anlise_comportamental", "analise_de_comportamento", "behavioral_analysis"],
    anlise_comportamental: ["analise_comportamental", "anlise_comportamental", "analise_de_comportamento", "behavioral_analysis"],
    tunnel_de_acesso_remoto: ["tunnel_de_acesso_remoto", "tunnel_acesso_remoto", "acesso_remoto", "remote_access", "remote_access_tunnel"],
    acesso_remoto: ["tunnel_de_acesso_remoto", "tunnel_acesso_remoto", "acesso_remoto", "remote_access", "remote_access_tunnel"],
    cloud_storage: ["cloud_storage", "armazenamento_cloud", "cloud"],
  };

  const normalizedStoreFeatures = (store.features || []).map((f) =>
    f.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "")
  );

  function hasFeature(...slugs: string[]): boolean {
    for (const rawSlug of slugs) {
      const normSlug = rawSlug.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "");
      const targets = FEATURE_ALIASES[normSlug] || [normSlug, rawSlug];
      for (const target of targets) {
        const normTarget = target.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "");
        if (normalizedStoreFeatures.includes(normTarget) || (store.features || []).includes(target)) {
          return true;
        }
      }
    }
    return false;
  }

  return {
    ...store,
    hasLicense,
		isB2C,
		isB2B,
    maxCameras,
    maxPeople,
    hasFeature,
    canAddCamera: (currentCount: number) => currentCount < maxCameras,
    canAddPerson: (currentCount: number) => currentCount < maxPeople,
  };
}
