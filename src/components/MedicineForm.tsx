"use client";

import type { ExtractedMedicine } from "@/lib/types";

interface MedicineFormProps {
  medicine: ExtractedMedicine;
  index: number;
  onChange: (index: number, updated: ExtractedMedicine) => void;
  onRemove: (index: number) => void;
}

export default function MedicineForm({
  medicine,
  index,
  onChange,
  onRemove,
}: MedicineFormProps) {
  const isMissing = (val: string) => val === "nao encontrado";

  function handleChange(field: keyof ExtractedMedicine, value: string) {
    onChange(index, { ...medicine, [field]: value });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg">Remedio {index + 1}</h3>
        <button
          onClick={() => onRemove(index)}
          className="text-red-500 text-sm"
        >
          Remover
        </button>
      </div>

      <div>
        <label className="text-sm text-gray-500">Nome</label>
        <input
          type="text"
          value={isMissing(medicine.name) ? "" : medicine.name}
          placeholder={isMissing(medicine.name) ? "Ex: Losartana" : ""}
          onChange={(e) => handleChange("name", e.target.value)}
          className={`w-full border rounded-lg p-2 mt-1 ${
            isMissing(medicine.name) ? "border-orange-400 bg-orange-50" : ""
          }`}
        />
        {isMissing(medicine.name) && (
          <p className="text-orange-600 text-xs mt-1">Nao encontrado — preencha</p>
        )}
      </div>

      <div>
        <label className="text-sm text-gray-500">Dosagem</label>
        <input
          type="text"
          value={isMissing(medicine.dosage) ? "" : medicine.dosage}
          placeholder={isMissing(medicine.dosage) ? "Ex: 50mg" : ""}
          onChange={(e) => handleChange("dosage", e.target.value)}
          className={`w-full border rounded-lg p-2 mt-1 ${
            isMissing(medicine.dosage) ? "border-orange-400 bg-orange-50" : ""
          }`}
        />
        {isMissing(medicine.dosage) && (
          <p className="text-orange-600 text-xs mt-1">Nao encontrado — preencha</p>
        )}
      </div>

      <div>
        <label className="text-sm text-gray-500">Como tomar</label>
        <input
          type="text"
          value={isMissing(medicine.instructions) ? "" : medicine.instructions}
          placeholder={isMissing(medicine.instructions) ? "Ex: 1 comprimido" : ""}
          onChange={(e) => handleChange("instructions", e.target.value)}
          className={`w-full border rounded-lg p-2 mt-1 ${
            isMissing(medicine.instructions) ? "border-orange-400 bg-orange-50" : ""
          }`}
        />
        {isMissing(medicine.instructions) && (
          <p className="text-orange-600 text-xs mt-1">Nao encontrado — preencha</p>
        )}
      </div>

      <div>
        <label className="text-sm text-gray-500">Frequencia</label>
        <input
          type="text"
          value={isMissing(medicine.frequency) ? "" : medicine.frequency}
          placeholder={isMissing(medicine.frequency) ? "Ex: 12/12h ou 1x ao dia" : ""}
          onChange={(e) => handleChange("frequency", e.target.value)}
          className={`w-full border rounded-lg p-2 mt-1 ${
            isMissing(medicine.frequency) ? "border-orange-400 bg-orange-50" : ""
          }`}
        />
        {isMissing(medicine.frequency) && (
          <p className="text-orange-600 text-xs mt-1">Nao encontrado — preencha</p>
        )}
      </div>

      <div>
        <label className="text-sm text-gray-500">Duracao</label>
        <input
          type="text"
          value={isMissing(medicine.duration) ? "" : medicine.duration}
          placeholder={isMissing(medicine.duration) ? "Ex: 30 dias ou uso continuo" : ""}
          onChange={(e) => handleChange("duration", e.target.value)}
          className={`w-full border rounded-lg p-2 mt-1 ${
            isMissing(medicine.duration) ? "border-orange-400 bg-orange-50" : ""
          }`}
        />
        {isMissing(medicine.duration) && (
          <p className="text-orange-600 text-xs mt-1">Nao encontrado — preencha</p>
        )}
      </div>
    </div>
  );
}
