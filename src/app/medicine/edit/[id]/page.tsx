"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateMedicine } from "@/lib/firestore";
import { parseDurationToDays } from "@/lib/doses";
import { drogasilSearchUrl } from "@/lib/pharmacy";
import AuthGuard from "@/components/AuthGuard";
import Nav from "@/components/Nav";
import SchedulePicker from "@/components/SchedulePicker";
import type { Medicine } from "@/lib/types";

function durationDaysToText(days: number | null): string {
  if (days === null) return "uso continuo";
  if (days % 30 === 0 && days >= 30) {
    const months = days / 30;
    return months === 1 ? "1 mes" : `${months} meses`;
  }
  return `${days} dias`;
}

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();
  const medicineId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [duration, setDuration] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMedicine() {
      const snap = await getDoc(doc(db, "medicines", medicineId));
      if (!snap.exists()) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const med = { id: snap.id, ...snap.data() } as Medicine;
      setName(med.name);
      setDosage(med.dosage === "-" ? "" : med.dosage);
      setInstructions(med.instructions === "-" ? "" : med.instructions);
      setDuration(durationDaysToText(med.durationDays));
      setTimes(med.times.length ? med.times : ["08:00"]);
      setLoading(false);
    }
    loadMedicine();
  }, [medicineId]);

  async function handleSave() {
    if (!name.trim()) return;

    setSaving(true);
    setError("");

    try {
      const durationDays = duration ? parseDurationToDays(duration) : null;

      await updateMedicine(medicineId, {
        name: name.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim(),
        times,
        durationDays,
      });

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar. Tente novamente.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <p className="text-gray-400">Carregando...</p>
        </div>
      </AuthGuard>
    );
  }

  if (notFound) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
          <p className="text-gray-300 mb-4">Remedio nao encontrado.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white rounded-lg px-6 py-3 font-semibold"
          >
            Voltar
          </button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 pb-20">
        <header className="bg-blue-600 text-white p-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-white/90 text-sm mb-2 -ml-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Voltar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Voltar</span>
          </button>
          <h1 className="text-xl font-bold">Editar Remedio</h1>
        </header>

        <main className="p-4 space-y-4">
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl p-3">{error}</p>
          )}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-4">
            <div>
              <label className="text-sm text-gray-400">Nome *</label>
              <input
                type="text"
                placeholder="Ex: Losartana"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-lg text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
              {name.trim().length > 0 && (
                <a
                  href={drogasilSearchUrl(name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-blue-400 font-medium inline-flex items-center gap-1"
                >
                  <svg
                    width="14"
                    height="14"
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
                  Consultar preço e disponibilidade
                </a>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400">Dosagem</label>
              <input
                type="text"
                placeholder="Ex: 50mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-lg text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Como tomar</label>
              <input
                type="text"
                placeholder="Ex: 1 comprimido"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-lg text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Duracao</label>
              <input
                type="text"
                placeholder="Ex: 30 dias ou uso continuo"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-lg text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Horarios dos lembretes</label>
              <SchedulePicker times={times} onChange={setTimes} />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full bg-blue-600 text-white rounded-lg p-4 text-lg font-semibold disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            disabled={saving}
            className="w-full bg-gray-700 text-gray-200 rounded-lg p-3 font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
        </main>

        <Nav />
      </div>
    </AuthGuard>
  );
}
