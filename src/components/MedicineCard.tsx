"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateMedicine } from "@/lib/firestore";
import { drogasilSearchUrl } from "@/lib/pharmacy";
import { displayField } from "@/lib/medicine";
import type { Medicine } from "@/lib/types";

export default function MedicineCard({ medicine }: { medicine: Medicine }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDeactivate() {
    if (!medicine.id) return;
    setLoading(true);
    await deactivateMedicine(medicine.id);
  }

  const daysLeft = medicine.durationDays
    ? Math.max(
        0,
        medicine.durationDays -
          Math.floor(
            (Date.now() - new Date(medicine.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
      )
    : null;

  const dosage = displayField(medicine.dosage);
  const instructions = displayField(medicine.instructions);
  const subtitleParts = [dosage, instructions].filter(Boolean);
  const durationLabel =
    daysLeft !== null ? `${daysLeft} dias restantes` : "Uso contínuo";

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700/70 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center text-xl">
          💊
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base leading-tight truncate">
            {medicine.name}
          </h3>
          {subtitleParts.length > 0 && (
            <p className="text-sm text-gray-400 mt-0.5 truncate">
              {subtitleParts.join(" · ")}
            </p>
          )}
        </div>
        <a
          href={drogasilSearchUrl(medicine.name)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar preço e disponibilidade de ${medicine.name}`}
          title="Consultar preço e disponibilidade"
          className="shrink-0 w-9 h-9 rounded-full text-blue-300 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {medicine.times.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {medicine.times.map((time) => (
            <span
              key={time}
              className="bg-gray-900/60 text-gray-200 text-xs font-mono px-2 py-1 rounded-md border border-gray-700"
            >
              {time}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700/60 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">{durationLabel}</span>
        {!confirming ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => medicine.id && router.push(`/medicine/edit/${medicine.id}`)}
              className="text-xs text-blue-400 font-medium hover:text-blue-300"
            >
              Editar
            </button>
            <span className="text-gray-600">·</span>
            <button
              onClick={() => setConfirming(true)}
              className="text-xs text-gray-400 hover:text-gray-300"
            >
              Parar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeactivate}
              disabled={loading}
              className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg disabled:opacity-50"
            >
              {loading ? "..." : "Confirmar"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-gray-300 px-2 py-1"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
