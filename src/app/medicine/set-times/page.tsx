"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { saveMedicine } from "@/lib/firestore";
import { parseDurationToDays, inferDoseCount, defaultTimesForCount } from "@/lib/doses";
import { displayField } from "@/lib/medicine";
import AuthGuard from "@/components/AuthGuard";
import SchedulePicker from "@/components/SchedulePicker";
import type { ExtractedMedicine } from "@/lib/types";

interface MedicineWithTimes extends ExtractedMedicine {
  times: string[];
}

export default function SetTimesPage() {
  const router = useRouter();
  const [prescriptionId, setPrescriptionId] = useState("");
  const [medicines, setMedicines] = useState<MedicineWithTimes[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("confirmedMedicines");
    if (!stored) {
      router.replace("/receita/upload");
      return;
    }
    const data = JSON.parse(stored);
    setPrescriptionId(data.prescriptionId);

    const withTimes = data.medicines.map((m: ExtractedMedicine) => ({
      ...m,
      times: defaultTimesForCount(inferDoseCount(m.frequency)),
    }));
    setMedicines(withTimes);
    setLoading(false);
  }, [router]);

  function updateTimes(index: number, times: string[]) {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, times } : m))
    );
  }

  async function handleSave() {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);

    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      for (const med of medicines) {
        const durationDays = parseDurationToDays(med.duration);

        await saveMedicine({
          userId: user.uid,
          prescriptionId,
          name: med.name,
          dosage: displayField(med.dosage),
          instructions: displayField(med.instructions),
          times: med.times,
          durationDays,
          startDate: today,
          active: true,
        });
      }

      // Clean up session storage
      sessionStorage.removeItem("pendingMedicines");
      sessionStorage.removeItem("confirmedMedicines");

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar. Tente novamente.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 pb-32">
        <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 pt-5 pb-8 rounded-b-3xl shadow-lg">
          <svg
            className="absolute right-2 top-4 opacity-90 pointer-events-none"
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            aria-hidden
          >
            <circle cx="95" cy="25" r="22" fill="white" fillOpacity="0.08" />
            <circle cx="25" cy="100" r="14" fill="white" fillOpacity="0.08" />
            <g transform="translate(55 18) rotate(35)">
              <rect x="0" y="0" width="56" height="24" rx="12" fill="white" fillOpacity="0.95" />
              <rect x="28" y="0" width="28" height="24" rx="12" fill="#fca5a5" />
              <line x1="28" y1="2" x2="28" y2="22" stroke="#1e3a8a" strokeOpacity="0.25" strokeWidth="1" />
              <circle cx="10" cy="12" r="2" fill="#1e3a8a" fillOpacity="0.2" />
              <circle cx="18" cy="8" r="1.5" fill="#1e3a8a" fillOpacity="0.15" />
            </g>
            <path
              d="M8 70 L22 70 L28 58 L36 82 L42 64 L50 70 L72 70"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.85"
            />
            <path
              d="M60 92 C60 85, 68 82, 72 88 C76 82, 84 85, 84 92 C84 98, 72 106, 72 106 C72 106, 60 98, 60 92 Z"
              fill="#fca5a5"
              opacity="0.9"
            />
          </svg>

          <div className="relative">
            <div className="flex items-center gap-2 text-blue-100 text-xs font-medium mb-4">
              <span className="px-2 py-1 rounded-full bg-white/20">1. Foto</span>
              <span>›</span>
              <span className="px-2 py-1 rounded-full bg-white/20">2. Confirmar</span>
              <span>›</span>
              <span className="px-2 py-1 rounded-full bg-white text-blue-700 font-semibold">
                3. Horários
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-tight max-w-[60%]">
              Definir Horários
            </h1>
            <p className="text-blue-100 text-sm mt-2 max-w-[60%]">
              Escolha quando você quer ser lembrado
            </p>
          </div>
        </header>

        <main className="px-4 pt-6 space-y-4">
          {medicines.map((med, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden"
            >
              <div className="flex items-start gap-3 p-5 border-b border-gray-100">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 leading-snug">
                    {med.name}
                  </h3>
                  {displayField(med.dosage) && (
                    <p className="text-sm text-blue-600 font-medium">
                      {displayField(med.dosage)}
                    </p>
                  )}
                  {displayField(med.instructions) && (
                    <p className="text-gray-500 text-sm mt-1">
                      {displayField(med.instructions)}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-5 bg-gray-50/50">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">
                  Horários do lembrete
                </p>
                <SchedulePicker
                  times={med.times}
                  onChange={(times) => updateTimes(i, times)}
                />
              </div>
            </div>
          ))}
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 p-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 text-lg font-semibold shadow-md disabled:opacity-50 active:scale-[0.99] transition"
          >
            {saving ? "Salvando..." : "Salvar e Ativar Lembretes"}
          </button>
        </div>
      </div>
    </AuthGuard>
  );
}
