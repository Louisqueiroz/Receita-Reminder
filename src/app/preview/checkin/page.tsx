"use client";

import { useMemo, useState } from "react";
import CheckInCard, { type CheckInStatus } from "@/components/CheckInCard";

const MOCK_MEDICINE = {
  name: "Amoxicilina",
  dosage: "500mg",
  instructions: "Tomar 1 comprimido com água, pode ser com ou sem alimentos.",
  doseNumber: 2,
  totalDoses: 3,
};

export default function CheckinPreviewPage() {
  const [status, setStatus] = useState<CheckInStatus>("pending");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  const scheduledAt = useMemo(() => new Date(), []);

  function handle(next: CheckInStatus, incomingNote?: string) {
    setSaving(true);
    if (incomingNote !== undefined) setNote(incomingNote);
    setTimeout(() => {
      setStatus(next);
      setSaving(false);
    }, 250);
  }

  async function handleSaveNote(next: string) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    setNote(next);
  }

  return (
    <CheckInCard
      medicineName={MOCK_MEDICINE.name}
      dosage={MOCK_MEDICINE.dosage}
      instructions={MOCK_MEDICINE.instructions}
      scheduledAt={scheduledAt}
      doseNumber={MOCK_MEDICINE.doseNumber}
      totalDoses={MOCK_MEDICINE.totalDoses}
      status={status}
      saving={saving}
      initialNote={note}
      onTaken={(n) => handle("taken", n)}
      onSkipped={(n) => handle("skipped", n)}
      onSaveNote={handleSaveNote}
      topBadge={
        <span className="text-[10px] bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full font-semibold">
          preview · check-in v2
        </span>
      }
      topAction={
        status !== "pending" ? (
          <button
            onClick={() => {
              setStatus("pending");
              setNote("");
            }}
            className="text-[11px] bg-gray-700 text-gray-200 px-2 py-1 rounded-full"
          >
            resetar
          </button>
        ) : null
      }
    />
  );
}
