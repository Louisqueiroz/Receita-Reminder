import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import webpush from "web-push";

// VAPID keys for standard Web Push (iOS Safari)
const VAPID_PUBLIC_KEY = "BA4kK0__SRJtqfKAKzsYBPwQH1lWlEb-ms90_XJRTfK3oDKsQIPJoczGf8g4g3QfYRfmTZNziLl_1dIqhSDMaq0";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return true;
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!privateKey) {
    console.error("VAPID_PRIVATE_KEY not set");
    return false;
  }
  webpush.setVapidDetails("mailto:laamarq7@gmail.com", VAPID_PUBLIC_KEY, privateKey);
  vapidConfigured = true;
  return true;
}

async function sendToUser(
  user: FirebaseFirestore.DocumentData,
  payload: { title: string; body: string; doseIds: string },
  doseId: string
): Promise<boolean> {
  // Prefer FCM when available. Only fall back to Web Push if FCM isn't configured
  // or fails — otherwise a user with both registered gets the same notification twice.
  if (user.fcmToken) {
    try {
      const messaging = getMessaging();
      await messaging.send({
        token: user.fcmToken,
        data: {
          title: payload.title,
          body: payload.body,
          doseIds: payload.doseIds,
        },
        webpush: {
          headers: { Urgency: "high" },
        },
      });
      console.log(`FCM sent for dose ${doseId}`);
      return true;
    } catch (err: unknown) {
      const error = err as { code?: string };
      console.warn(`FCM failed for dose ${doseId}:`, error.code || err);
    }
  }

  if (user.pushSubscription) {
    if (!ensureVapid()) {
      console.error(`Web Push skipped for dose ${doseId}: VAPID not configured`);
      return false;
    }
    try {
      await webpush.sendNotification(
        user.pushSubscription,
        JSON.stringify(payload)
      );
      console.log(`Web Push sent for dose ${doseId}`);
      return true;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      console.error(`Web Push failed for dose ${doseId}: status=${error.statusCode} msg=${error.message}`);
    }
  }

  console.log(`No delivery method succeeded for dose ${doseId}`);
  return false;
}

export const sendDoseNotifications = onSchedule(
  { schedule: "every 1 minutes", region: "southamerica-east1", secrets: ["VAPID_PRIVATE_KEY"] },
  async () => {
    const db = getFirestore();
    const now = new Date();

    console.log("Scheduler running at:", now.toISOString());

    // 1. Find overdue doses that haven't been notified yet
    const overdueQuery = await db
      .collection("doses")
      .where("status", "==", "pending")
      .where("notificationSent", "==", false)
      .where("scheduledAt", "<=", Timestamp.fromDate(now))
      .get();

    console.log("Found overdue doses:", overdueQuery.size);

    await processGroups(db, overdueQuery.docs, "notificationSent", (n) =>
      n === 1 ? "Hora do remedio" : `Hora dos remedios (${n})`
    );

    // 2. Follow-up reminders: doses 30+ minutes overdue
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const followUpQuery = await db
      .collection("doses")
      .where("status", "==", "pending")
      .where("notificationSent", "==", true)
      .where("followUpSent", "==", false)
      .where("scheduledAt", "<=", Timestamp.fromDate(thirtyMinAgo))
      .get();

    await processGroups(db, followUpQuery.docs, "followUpSent", (n) =>
      n === 1 ? "Voce ainda nao registrou" : `${n} remedios pendentes`
    );
  }
);

function groupKey(userId: string, scheduledAt: Timestamp): string {
  // Bucket by minute so doses scheduled for the same time collapse into one group
  const minute = scheduledAt.toDate().toISOString().slice(0, 16);
  return `${userId}|${minute}`;
}

async function processGroups(
  db: FirebaseFirestore.Firestore,
  doseDocs: FirebaseFirestore.QueryDocumentSnapshot[],
  flagField: "notificationSent" | "followUpSent",
  titleFor: (n: number) => string
) {
  const groups = new Map<string, FirebaseFirestore.QueryDocumentSnapshot[]>();
  for (const doseDoc of doseDocs) {
    const dose = doseDoc.data();
    const key = groupKey(dose.userId, dose.scheduledAt);
    const list = groups.get(key) ?? [];
    list.push(doseDoc);
    groups.set(key, list);
  }

  for (const [key, docs] of groups) {
    const userId = docs[0].data().userId;

    // Resolve medicines, filter inactive
    const valid: { doseDoc: FirebaseFirestore.QueryDocumentSnapshot; name: string; dosage: string }[] = [];
    for (const doseDoc of docs) {
      const dose = doseDoc.data();
      const medDoc = await db.collection("medicines").doc(dose.medicineId).get();
      if (!medDoc.exists) continue;
      const med = medDoc.data()!;
      if (!med.active) continue;
      valid.push({ doseDoc, name: med.name, dosage: med.dosage });
    }
    if (valid.length === 0) continue;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) continue;
    const user = userDoc.data()!;
    if (!user.fcmToken && !user.pushSubscription) continue;

    const body = valid
      .map((v) => `${v.name}${v.dosage ? " " + v.dosage : ""}`)
      .join(", ");
    const doseIds = valid.map((v) => v.doseDoc.id).join(",");

    console.log(`Sending ${flagField} group ${key} with ${valid.length} doses`);
    const sent = await sendToUser(
      user,
      { title: titleFor(valid.length), body, doseIds },
      valid[0].doseDoc.id
    );

    if (sent) {
      const batch = db.batch();
      for (const v of valid) batch.update(v.doseDoc.ref, { [flagField]: true });
      await batch.commit();
    }
  }
}
