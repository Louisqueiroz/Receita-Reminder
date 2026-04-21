import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import type { Medicine, Dose } from "./types";

export async function saveMedicine(
  medicine: Omit<Medicine, "id">
): Promise<string> {
  const docRef = await addDoc(collection(db, "medicines"), medicine);
  return docRef.id;
}

export async function updateMedicine(
  medicineId: string,
  updates: Partial<Omit<Medicine, "id" | "userId">>
): Promise<void> {
  await updateDoc(doc(db, "medicines", medicineId), updates);
}

export async function saveDoses(doses: Omit<Dose, "id">[]): Promise<void> {
  const batch = writeBatch(db);

  for (const dose of doses) {
    const docRef = doc(collection(db, "doses"));
    batch.set(docRef, {
      ...dose,
      scheduledAt: Timestamp.fromDate(dose.scheduledAt),
      respondedAt: dose.respondedAt
        ? Timestamp.fromDate(dose.respondedAt)
        : null,
    });
  }

  await batch.commit();
}

export async function updateDoseStatus(
  doseId: string,
  status: "taken" | "skipped",
  note?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    respondedAt: Timestamp.fromDate(new Date()),
  };
  if (note !== undefined) {
    const trimmed = note.trim();
    updates.note = trimmed.length > 0 ? trimmed : null;
  }
  await updateDoc(doc(db, "doses", doseId), updates);
}

export async function updateDoseNote(
  doseId: string,
  note: string
): Promise<void> {
  const trimmed = note.trim();
  await updateDoc(doc(db, "doses", doseId), {
    note: trimmed.length > 0 ? trimmed : null,
  });
}

export async function deactivateMedicine(medicineId: string): Promise<void> {
  await updateDoc(doc(db, "medicines", medicineId), { active: false });

  // Delete future pending doses
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "doses"),
    where("medicineId", "==", medicineId),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
