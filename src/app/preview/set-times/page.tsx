"use client";

import { useState } from "react";
import TimePicker from "@/components/TimePicker";

interface MedicineWithTimes {
  name: string;
  dosage: string;
  instructions: string;
  times: string[];
}

const SEED: MedicineWithTimes[] = [
  {
    name: "Amoxicilina",
    dosage: "500mg",
    instructions: "Tomar 1 comprimido a cada 8 horas",
    times: ["08:00", "16:00", "00:00"],
  },
  {
    name: "Dipirona",
    dosage: "1g",
    instructions: "Em caso de dor ou febre",
    times: ["08:00", "20:00"],
  },
  {
    name: "Omeprazol",
    dosage: "20mg",
    instructions: "Tomar em jejum",
    times: ["07:00"],
  },
];

export default function SetTimesPreviewPage() {
  const [medicines, setMedicines] = useState<MedicineWithTimes[]>(SEED);

  function updateTimes(index: number, times: string[]) {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, times } : m))
    );
  }

  return (
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
          <p className="mt-3 text-xs text-blue-100/80 italic">
            (Página de preview — dados fictícios, sem login)
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
                {med.dosage && (
                  <p className="text-sm text-blue-600 font-medium">
                    {med.dosage}
                  </p>
                )}
                {med.instructions && (
                  <p className="text-gray-500 text-sm mt-1">
                    {med.instructions}
                  </p>
                )}
              </div>
            </div>

            <div className="p-5 bg-gray-50/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">
                Horários do lembrete
              </p>
              <TimePicker
                times={med.times}
                onChange={(times) => updateTimes(i, times)}
              />
            </div>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 p-4">
        <button
          disabled
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 text-lg font-semibold shadow-md opacity-70 cursor-not-allowed"
        >
          Salvar e Ativar Lembretes (desabilitado no preview)
        </button>
      </div>
    </div>
  );
}
