"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateDoseStatus } from "@/lib/firestore";
import { displayField } from "@/lib/medicine";
import AuthGuard from "@/components/AuthGuard";
import type { Dose, Medicine } from "@/lib/types";

interface Row {
  dose: Dose;
  medicine: Medicine;
}

function DosesPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const idsParam = params.get("ids") ?? "";
  const ids = idsParam.split(",").filter(Boolean);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState<null | "taken" | "skipped">(null);

  useEffect(() => {
    if (ids.length === 0) {
      router.replace("/dashboard");
      return;
    }

    async function load() {
      const loaded: Row[] = [];
      for (const id of ids) {
        const doseSnap = await getDoc(doc(db, "doses", id));
        if (!doseSnap.exists()) continue;
        const dose = { id: doseSnap.id, ...doseSnap.data() } as Dose;

        const medSnap = await getDoc(doc(db, "medicines", dose.medicineId));
        if (!medSnap.exists()) continue;
        const medicine = { id: medSnap.id, ...medSnap.data() } as Medicine;

        loaded.push({ dose, medicine });
      }
      setRows(loaded);
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  async function resolveOne(doseId: string, status: "taken" | "skipped") {
    setSavingId(doseId);
    await updateDoseStatus(doseId, status);
    setRows((prev) =>
      prev.map((r) =>
        r.dose.id === doseId ? { ...r, dose: { ...r.dose, status } } : r
      )
    );
    setSavingId(null);
  }

  async function resolveAll(status: "taken" | "skipped") {
    setBatchSaving(status);
    const pending = rows.filter((r) => r.dose.status === "pending");
    await Promise.all(pending.map((r) => updateDoseStatus(r.dose.id!, status)));
    setRows((prev) =>
      prev.map((r) =>
        r.dose.status === "pending" ? { ...r, dose: { ...r.dose, status } } : r
      )
    );
    setBatchSaving(null);
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (rows.length === 0) return null;

  const anyPending = rows.some((r) => r.dose.status === "pending");
  const groupTime = rows[0].dose.scheduledAt
    ? new Date(
        (rows[0].dose.scheduledAt as unknown as { toDate: () => Date })
          .toDate()
      ).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 pb-32">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 pt-6 pb-8 rounded-b-3xl shadow-lg">
          <h1 className="text-2xl font-bold leading-tight">Hora dos remédios</h1>
          {groupTime && (
            <p className="text-blue-100 text-sm mt-1">Agendado para {groupTime}</p>
          )}
          <p className="text-blue-100 text-sm mt-2">
            {rows.length} {rows.length === 1 ? "remédio" : "remédios"} para confirmar
          </p>
        </header>

        <main className="px-4 pt-6 space-y-3">
          {rows.map(({ dose, medicine }) => {
            const done = dose.status !== "pending";
            return (
              <div
                key={dose.id}
                className="bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-700 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-white leading-snug">
                      {medicine.name}
                    </h3>
                    {displayField(medicine.dosage) && (
                      <p className="text-blue-400 text-sm font-medium">
                        {displayField(medicine.dosage)}
                      </p>
                    )}
                    {displayField(medicine.instructions) && (
                      <p className="text-gray-300 text-sm mt-1">
                        {displayField(medicine.instructions)}
                      </p>
                    )}
                  </div>
                  {done && (
                    <span
                      className={`shrink-0 text-sm font-semibold px-3 py-1 rounded-full ${
                        dose.status === "taken"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {dose.status === "taken" ? "Tomado" : "Pulado"}
                    </span>
                  )}
                </div>

                {!done && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => resolveOne(dose.id!, "taken")}
                      disabled={savingId === dose.id || !!batchSaving}
                      className="flex-1 bg-green-500 text-white rounded-xl py-3 font-bold disabled:opacity-50"
                    >
                      Tomei
                    </button>
                    <button
                      onClick={() => resolveOne(dose.id!, "skipped")}
                      disabled={savingId === dose.id || !!batchSaving}
                      className="flex-1 bg-red-400 text-white rounded-xl py-3 font-bold disabled:opacity-50"
                    >
                      Pulei
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </main>

        {anyPending && rows.length > 1 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-t border-gray-700 p-4 space-y-2">
            <button
              onClick={() => resolveAll("taken")}
              disabled={!!batchSaving || !!savingId}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-4 font-semibold shadow-md disabled:opacity-50"
            >
              {batchSaving === "taken" ? "Salvando..." : "Tomei todos"}
            </button>
            <button
              onClick={() => resolveAll("skipped")}
              disabled={!!batchSaving || !!savingId}
              className="w-full text-red-500 font-medium py-2"
            >
              {batchSaving === "skipped" ? "Salvando..." : "Pulei todos"}
            </button>
          </div>
        )}

        {!anyPending && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-t border-gray-700 p-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 font-semibold shadow-md"
            >
              Voltar ao início
            </button>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

export default function DosesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Carregando...</p></div>}>
      <DosesPageInner />
    </Suspense>
  );
}
