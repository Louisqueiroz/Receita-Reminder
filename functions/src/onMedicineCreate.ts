import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export const onMedicineCreated = onDocumentCreated(
  { document: "medicines/{medicineId}", region: "southamerica-east1" },
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.active || !data.times?.length) return;

    const db = getFirestore();
    const medicineId = event.params.medicineId;
    const now = new Date();
    const batch = db.batch();

    // Generate doses for today and tomorrow
    for (let d = 0; d < 2; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      const dayStr = day.toISOString().split("T")[0];

      for (const time of data.times) {
        const [hours, minutes] = time.split(":").map(Number);
        const scheduledAt = new Date(dayStr + "T00:00:00Z");
        scheduledAt.setUTCHours(hours + 3, minutes, 0, 0);

        // Skip times that already passed
        if (scheduledAt <= now) continue;

        const doseRef = db.collection("doses").doc();
        batch.set(doseRef, {
          userId: data.userId,
          medicineId,
          scheduledAt: Timestamp.fromDate(scheduledAt),
          status: "pending",
          notificationSent: false,
          followUpSent: false,
          respondedAt: null,
        });
      }
    }

    await batch.commit();
  }
);
