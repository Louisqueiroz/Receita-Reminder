import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envText = readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx), l.slice(idx + 1).replace(/^"|"$/g, "")];
    })
);

const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

console.log("=== USERS ===");
const users = await db.collection("users").get();
const userIds = [];
for (const u of users.docs) {
  const d = u.data();
  console.log(`uid=${u.id}`);
  console.log(`  fcmToken: ${d.fcmToken ? d.fcmToken.slice(0, 25) + "..." : "<none>"}`);
  console.log(`  pushSubscription: ${d.pushSubscription ? "endpoint=" + (d.pushSubscription.endpoint || "?").slice(0, 70) + "..." : "<none>"}`);
  userIds.push(u.id);
}

for (const uid of userIds) {
  console.log(`\n=== user ${uid} ===`);

  console.log(`\n-- ACTIVE medicines --`);
  const meds = await db.collection("medicines").where("userId", "==", uid).get();
  let activeCount = 0;
  for (const m of meds.docs) {
    const md = m.data();
    if (md.active) activeCount++;
    console.log(`  ${m.id} ${md.name} active=${md.active} times=${JSON.stringify(md.times)} startDate=${md.startDate} durationDays=${md.durationDays}`);
  }
  console.log(`  total: ${meds.size}, active: ${activeCount}`);

  console.log(`\n-- LAST 10 doses (by scheduledAt) --`);
  const recent = await db
    .collection("doses")
    .where("userId", "==", uid)
    .orderBy("scheduledAt", "desc")
    .limit(10)
    .get();
  for (const d of recent.docs) {
    const x = d.data();
    const sched = x.scheduledAt.toDate().toISOString();
    console.log(`  ${sched} status=${x.status} notified=${x.notificationSent} medicineId=${x.medicineId}`);
  }

  console.log(`\n-- doses scheduled in NEXT 24h --`);
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcoming = await db
    .collection("doses")
    .where("userId", "==", uid)
    .where("scheduledAt", ">=", admin.firestore.Timestamp.fromDate(now))
    .where("scheduledAt", "<=", admin.firestore.Timestamp.fromDate(tomorrow))
    .get();
  console.log(`  total: ${upcoming.size}`);
  for (const d of upcoming.docs.slice(0, 5)) {
    const x = d.data();
    console.log(`  ${x.scheduledAt.toDate().toISOString()} status=${x.status} notified=${x.notificationSent}`);
  }
}

process.exit(0);
