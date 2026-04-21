import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export const onMedicineTimesChanged = onDocumentUpdated(
  { document: "medicines/{medicineId}", region: "southamerica-east1" },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Only react if times changed or medicine was deactivated
    const timesChanged =
      JSON.stringify(before.times) !== JSON.stringify(after.times);
    const wasDeactivated = before.active && !after.active;

    if (!timesChanged && !wasDeactivated) return;

    const db = getFirestore();
    const medicineId = event.params.medicineId;

    // Delete all future pending doses for this medicine
    const pendingDoses = await db
      .collection("doses")
      .where("medicineId", "==", medicineId)
      .where("status", "==", "pending")
      .get();

    const now = new Date();
    const batch = db.batch();

    for (const doseDoc of pendingDoses.docs) {
      const dose = doseDoc.data();
      const scheduledAt = dose.scheduledAt.toDate();
      if (scheduledAt > now) {
        batch.delete(doseDoc.ref);
      }
    }

    await batch.commit();

    // If medicine is still active and times changed, regenerate doses for next 2 days
    if (after.active && timesChanged) {
      const newBatch = db.batch();

      for (let d = 0; d < 2; d++) {
        const day = new Date(now);
        day.setDate(day.getDate() + d);
        const dayStr = day.toISOString().split("T")[0];

        for (const time of after.times) {
          const [hours, minutes] = time.split(":").map(Number);
          const scheduledAt = new Date(dayStr + "T00:00:00Z");
          scheduledAt.setUTCHours(hours + 3, minutes, 0, 0);

          if (scheduledAt <= now) continue;

          const doseRef = db.collection("doses").doc();
          newBatch.set(doseRef, {
            userId: after.userId,
            medicineId,
            scheduledAt: Timestamp.fromDate(scheduledAt),
            status: "pending",
            notificationSent: false,
            followUpSent: false,
            respondedAt: null,
          });
        }
      }

      await newBatch.commit();
    }
  }
);
