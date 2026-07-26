import { useLicenseStore } from "../stores/license";

export function useLicense() {
  const store = useLicenseStore();

  const hasLicense = store.licenseId !== null;
	const isB2C = store.type === "B2C";
	const isB2B = store.type === "B2B";

  const maxCameras = store.maxCameras === -1 ? Infinity : store.maxCameras;
  const maxPeople = store.maxPeople === -1 ? Infinity : store.maxPeople;
  const faceRecognition = store.features.includes("face_recognition");

  return {
    ...store,
    hasLicense,
		isB2C,
		isB2B,
    maxCameras,
    maxPeople,
    faceRecognition,
    canAddCamera: (currentCount: number) => currentCount < maxCameras,
    canAddPerson: (currentCount: number) => currentCount < maxPeople,
  };
}
