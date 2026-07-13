import { useLicenseStore } from "../stores/license";

export function useLicense() {
  const store = useLicenseStore();

  const hasLicense = store.licenseId !== null;
  const isTrial = store.type === "TRIAL";
  const isStandard = store.type === "STANDARD";

  const maxCameras = isTrial ? 1 : Infinity;
  const maxPeople = isTrial ? 10 : Infinity;
  const faceRecognition = isStandard;

  return {
    ...store,
    hasLicense,
    isTrial,
    isStandard,
    maxCameras,
    maxPeople,
    faceRecognition,
    canAddCamera: (currentCount: number) => currentCount < maxCameras,
    canAddPerson: (currentCount: number) => currentCount < maxPeople,
  };
}
