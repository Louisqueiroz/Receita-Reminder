"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Nav from "@/components/Nav";
import HistoryView, {
  getStartDateFromDoses,
  type DoseWithMedicine,
} from "@/components/HistoryView";
import type { Dose, Medicine } from "@/lib/types";

export default function HistoryPage() {
  const [doses, setDoses] = useState<DoseWithMedicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const medsSnap = await getDocs(
          query(collection(db, "medicines"), where("userId", "==", user.uid))
        );
        const medsMap = new Map<string, Medicine>();
        medsSnap.docs.forEach((d) => {
          medsMap.set(d.id, { id: d.id, ...d.data() } as Medicine);
        });

        const dosesSnap = await getDocs(
          query(collection(db, "doses"), where("userId", "==", user.uid))
        );

        const dosesWithMeds: DoseWithMedicine[] = dosesSnap.docs.map((d) => {
          const dose = { id: d.id, ...d.data() } as Dose;
          const med = medsMap.get(dose.medicineId);
          return {
            ...dose,
            medicineName: med?.name || "Remedio desconhecido",
            medicineDosage: med?.dosage || "",
          };
        });

        setDoses(dosesWithMeds);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const startDate = getStartDateFromDoses(doses);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 pb-20">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-bold">Historico</h1>
          <p className="text-blue-100 text-sm">
            {startDate
              ? `Desde ${startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`
              : "Sua jornada começa aqui"}
          </p>
        </header>

        <main className="p-4 space-y-6">
          <HistoryView doses={doses} loading={loading} />
        </main>

        <Nav />
      </div>
    </AuthGuard>
  );
}
