import { useLicenseStore } from "../stores/license";

export function useLicense() {
  const store = useLicenseStore();

  const hasLicense = store.licenseId !== null;
  const isTrial = store.type === "TRIAL";
  const isStandard = store.type === "STANDARD";

  const maxCameras = store.maxCameras === -1 ? Infinity : store.maxCameras;
  const maxPeople = store.maxPeople === -1 ? Infinity : store.maxPeople;
  const faceRecognition = store.features.includes("face_recognition");

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
