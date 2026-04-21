import { initializeApp } from "firebase-admin/app";

initializeApp();

export { sendDoseNotifications } from "./scheduler";
export { generateDailyDoses } from "./generateDoses";
export { onMedicineTimesChanged } from "./onMedicineUpdate";
export { onMedicineCreated } from "./onMedicineCreate";
