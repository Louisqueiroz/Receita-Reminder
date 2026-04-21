"use client";

import { useMemo } from "react";
import HistoryView, {
  getStartDateFromDoses,
  type DoseWithMedicine,
} from "@/components/HistoryView";

interface MockMedicine {
  id: string;
  name: string;
  dosage: string;
  hours: number[];
}

const MEDICINES: MockMedicine[] = [
  { id: "m1", name: "Amoxicilina", dosage: "500mg", hours: [8, 16, 0] },
  { id: "m2", name: "Omeprazol", dosage: "20mg", hours: [7] },
  { id: "m3", name: "Dipirona", dosage: "1g", hours: [9, 21] },
];

// Tiny seeded PRNG so the preview is stable across reloads.
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildMockDoses(daysBack: number): DoseWithMedicine[] {
  const rand = mulberry32(42);
  const now = new Date();
  const doses: DoseWithMedicine[] = [];

  for (let dayOffset = daysBack; dayOffset >= 0; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);
    day.setHours(0, 0, 0, 0);

    // Adherence improves over time: early days had more skips, recent days more taken.
    const progress = (daysBack - dayOffset) / daysBack;
    const skipChance = 0.25 - progress * 0.18;

    for (const med of MEDICINES) {
      for (const hour of med.hours) {
        const scheduledAt = new Date(day);
        scheduledAt.setHours(hour, 0, 0, 0);

        let status: DoseWithMedicine["status"];
        if (scheduledAt.getTime() > now.getTime()) {
          status = "pending";
        } else {
          const r = rand();
          if (r < skipChance) status = "skipped";
          else status = "taken";
        }

        doses.push({
          id: `${med.id}-${dayOffset}-${hour}`,
          userId: "preview",
          medicineId: med.id,
          scheduledAt,
          status,
          notificationSent: true,
          followUpSent: false,
          medicineName: med.name,
          medicineDosage: med.dosage,
        });
      }
    }
  }

  return doses;
}

export default function HistoryPreviewPage() {
  const doses = useMemo(() => buildMockDoses(30), []);
  const startDate = getStartDateFromDoses(doses);

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="bg-blue-600 text-white p-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold">Historico</h1>
          <span className="text-[10px] bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full font-semibold">
            preview · 30 dias
          </span>
        </div>
        <p className="text-blue-100 text-sm">
          {startDate
            ? `Desde ${startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`
            : "Sua jornada começa aqui"}
        </p>
      </header>

      <main className="p-4 space-y-6">
        <HistoryView doses={doses} />
      </main>
    </div>
  );
}
