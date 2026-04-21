"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import MedicineForm from "@/components/MedicineForm";
import type { ExtractedMedicine } from "@/lib/types";

export default function ConfirmReceitaPage() {
  const router = useRouter();
  const [prescriptionId, setPrescriptionId] = useState("");
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingMedicines");
    if (!stored) {
      router.replace("/receita/upload");
      return;
    }
    const data = JSON.parse(stored);
    setPrescriptionId(data.prescriptionId);
    setMedicines(data.medicines);
    setLoading(false);
  }, [router]);

  function handleChange(index: number, updated: ExtractedMedicine) {
    setMedicines((prev) => prev.map((m, i) => (i === index ? updated : m)));
  }

  function handleRemove(index: number) {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    sessionStorage.setItem(
      "confirmedMedicines",
      JSON.stringify({ prescriptionId, medicines })
    );
    router.push(`/medicine/set-times`);
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
      <div className="min-h-screen bg-gray-900 pb-24">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-bold">Confirmar Remedios</h1>
        </header>

        <main className="p-4 space-y-4">
          <p className="text-gray-600">
            Confira os remedios encontrados na sua receita. Campos em laranja
            nao foram encontrados — preencha com o que o medico orientou.
          </p>

          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
            <strong>Atencao:</strong> a leitura é feita por inteligencia
            artificial e pode conter erros. Confira cuidadosamente cada
            informacao antes de continuar.
          </div>

          {medicines.map((med, i) => (
            <MedicineForm
              key={i}
              medicine={med}
              index={i}
              onChange={handleChange}
              onRemove={handleRemove}
            />
          ))}

          {medicines.length === 0 && (
            <>
              <p className="text-center text-gray-500 py-8">
                Nenhum remedio encontrado. Volte e tente outra foto.
              </p>
              <button
                onClick={() => router.push("/receita/upload")}
                className="w-full bg-blue-600 text-white rounded-lg p-4 text-lg font-semibold"
              >
                Escolher outra foto
              </button>
            </>
          )}

          {medicines.length > 0 && (
            <button
              onClick={handleConfirm}
              className="w-full bg-blue-600 text-white rounded-lg p-4 text-lg font-semibold"
            >
              Confirmar e Definir Horarios
            </button>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
