"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateDoseStatus, updateDoseNote } from "@/lib/firestore";
import { displayField } from "@/lib/medicine";
import AuthGuard from "@/components/AuthGuard";
import CheckInCard, { type CheckInStatus } from "@/components/CheckInCard";
import type { Dose, Medicine } from "@/lib/types";

function toDate(val: unknown): Date {
  return val instanceof Timestamp ? val.toDate() : new Date(val as string);
}

function computeDoseNumber(medicine: Medicine, scheduledAt: Date): { number: number; total: number } {
  const total = Math.max(medicine.times.length, 1);
  if (!medicine.times.length) return { number: 1, total };
  const sorted = [...medicine.times].sort();
  const hh = String(scheduledAt.getHours()).padStart(2, "0");
  const mm = String(scheduledAt.getMinutes()).padStart(2, "0");
  const target = `${hh}:${mm}`;
  const idx = sorted.indexOf(target);
  return { number: idx >= 0 ? idx + 1 : 1, total };
}

export default function DoseResponsePage() {
  const router = useRouter();
  const params = useParams();
  const doseId = params.id as string;

  const [dose, setDose] = useState<Dose | null>(null);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState<CheckInStatus | null>(null);

  useEffect(() => {
    async function loadDose() {
      const doseDoc = await getDoc(doc(db, "doses", doseId));
      if (!doseDoc.exists()) {
        router.replace("/dashboard");
        return;
      }

      const doseData = { id: doseDoc.id, ...doseDoc.data() } as Dose;
      setDose(doseData);

      const medDoc = await getDoc(doc(db, "medicines", doseData.medicineId));
      if (medDoc.exists()) {
        setMedicine({ id: medDoc.id, ...medDoc.data() } as Medicine);
      }

      setLoading(false);
    }

    loadDose();
  }, [doseId, router]);

  async function handleResponse(status: "taken" | "skipped", note?: string) {
    setSaving(true);
    await updateDoseStatus(doseId, status, note);
    setDose((prev) =>
      prev ? { ...prev, status, note: note?.trim() || undefined } : prev
    );
    setLocalStatus(status);
    setSaving(false);
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  async function handleSaveNote(note: string) {
    await updateDoseNote(doseId, note);
    setDose((prev) =>
      prev ? { ...prev, note: note.trim() || undefined } : prev
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!dose || !medicine) return null;

  const scheduledAt = toDate(dose.scheduledAt);
  const { number, total } = computeDoseNumber(medicine, scheduledAt);
  const status: CheckInStatus = localStatus ?? (dose.status as CheckInStatus);

  return (
    <AuthGuard>
      <CheckInCard
        medicineName={medicine.name}
        dosage={displayField(medicine.dosage)}
        instructions={displayField(medicine.instructions)}
        scheduledAt={scheduledAt}
        doseNumber={number}
        totalDoses={total}
        status={status}
        saving={saving}
        initialNote={dose.note || ""}
        onTaken={(note) => handleResponse("taken", note)}
        onSkipped={(note) => handleResponse("skipped", note)}
        onSaveNote={handleSaveNote}
        onBack={() => router.push("/dashboard")}
      />
    </AuthGuard>
  );
}
