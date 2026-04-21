import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export const generateDailyDoses = onSchedule(
  { schedule: "0 0 * * *", region: "southamerica-east1" },
  async () => {
    const db = getFirestore();
    const now = new Date();

    // Get all active medicines
    const medicinesQuery = await db
      .collection("medicines")
      .where("active", "==", true)
      .get();

    let batch = db.batch();
    let batchCount = 0;

    for (const medDoc of medicinesQuery.docs) {
      const medicine = medDoc.data();

      // Check if medicine has expired
      if (medicine.durationDays) {
        const startDate = new Date(medicine.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + medicine.durationDays);

        if (now >= endDate) {
          // Deactivate expired medicine
          batch.update(medDoc.ref, { active: false });
          batchCount++;
          continue;
        }
      }

      // Generate doses for tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      for (const time of medicine.times) {
        const [hours, minutes] = time.split(":").map(Number);
        const scheduledAt = new Date(tomorrowStr + "T00:00:00Z");
        scheduledAt.setUTCHours(hours + 3, minutes, 0, 0);

        const doseRef = db.collection("doses").doc();
        batch.set(doseRef, {
          userId: medicine.userId,
          medicineId: medDoc.id,
          scheduledAt: Timestamp.fromDate(scheduledAt),
          status: "pending",
          notificationSent: false,
          followUpSent: false,
          respondedAt: null,
        });
        batchCount++;

        // Firestore batch limit is 500 operations
        if (batchCount >= 490) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
  }
);
