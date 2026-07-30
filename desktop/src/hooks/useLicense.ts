import { useLicenseStore } from "../stores/license";

export function useLicense() {
  const store = useLicenseStore();

  const hasLicense = store.licenseId !== null;
	const isB2C = store.type === "B2C";
	const isB2B = store.type === "B2B";

  const maxCameras = store.maxCameras === -1 ? Infinity : store.maxCameras;
  const maxPeople = store.maxPeople === -1 ? Infinity : store.maxPeople;

  function hasFeature(...slugs: string[]): boolean {
    for (const slug of slugs) {
      if (store.features.includes(slug)) return true;
      const nfd = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (nfd !== slug && store.features.includes(nfd)) return true;
      const stripped = (nfd || slug).replace(/[^a-z0-9_]/g, "");
      if (store.features.includes(stripped)) return true;
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
