"use client";

import { ReactNode, useEffect, useState } from "react";

export type CheckInStatus = "pending" | "taken" | "skipped";

interface CheckInCardProps {
  medicineName: string;
  dosage: string;
  instructions: string;
  scheduledAt: Date;
  doseNumber: number;
  totalDoses: number;
  status: CheckInStatus;
  saving?: boolean;
  initialNote?: string;
  onTaken: (note?: string) => void;
  onSkipped: (note?: string) => void;
  onSaveNote?: (note: string) => Promise<void> | void;
  onBack?: () => void;
  topBadge?: ReactNode;
  topAction?: ReactNode;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function isWithinMinutes(d: Date, minutes: number, now: Date): boolean {
  return Math.abs(d.getTime() - now.getTime()) <= minutes * 60 * 1000;
}

export default function CheckInCard({
  medicineName,
  dosage,
  instructions,
  scheduledAt,
  doseNumber,
  totalDoses,
  status,
  saving = false,
  initialNote = "",
  onTaken,
  onSkipped,
  onSaveNote,
  onBack,
  topBadge,
  topAction,
}: CheckInCardProps) {
  const now = new Date();
  const isNow = isWithinMinutes(scheduledAt, 10, now);
  const isPast = scheduledAt.getTime() < now.getTime() - 10 * 60 * 1000;
  const alreadyResponded = status !== "pending";

  const [note, setNote] = useState(initialNote);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  const noteDirty = note.trim() !== (initialNote || "").trim();

  async function handleSaveNote() {
    if (!onSaveNote || savingNote) return;
    setSavingNote(true);
    try {
      await onSaveNote(note);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {(topBadge || topAction) && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
          <div className="pointer-events-auto">{topBadge}</div>
          <div className="pointer-events-auto">{topAction}</div>
        </div>
      )}

      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 pt-16 pb-12 rounded-b-[2.5rem] shadow-xl">
        <p className="text-blue-100 text-sm">{greeting()},</p>
        <p className="text-white text-base font-medium">hora do remédio</p>

        <div className="mt-8 flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur flex items-center justify-center text-5xl shadow-inner">
            💊
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-2xl font-bold leading-tight truncate">
              {medicineName}
            </h1>
            <p className="text-blue-100 text-base">{dosage}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatTime(scheduledAt)}
          </span>
          {isNow && (
            <span className="inline-flex items-center gap-1 bg-green-400/25 text-green-100 text-xs px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              agora
            </span>
          )}
          {isPast && !isNow && (
            <span className="inline-flex items-center gap-1 bg-yellow-400/25 text-yellow-100 text-xs px-3 py-1.5 rounded-full font-medium">
              atrasado
            </span>
          )}
          {totalDoses > 1 && (
            <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full">
              dose {doseNumber}/{totalDoses}
            </span>
          )}
        </div>
      </div>

      <main className="flex-1 px-6 pt-6 pb-8 space-y-5">
        {instructions && (
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
                Como tomar
              </p>
              <p className="text-gray-200 text-sm leading-relaxed">{instructions}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 space-y-2">
          <label
            htmlFor="dose-note"
            className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Observações (opcional)
          </label>
          <textarea
            id="dose-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={saving || savingNote}
            rows={3}
            placeholder="Como está se sentindo? Sintomas, reações, lembretes..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none resize-none disabled:opacity-60"
          />
          {alreadyResponded && onSaveNote && (
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={!noteDirty || savingNote}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-40 transition-colors"
            >
              {savingNote ? "Salvando..." : "Salvar observação"}
            </button>
          )}
        </div>

        {alreadyResponded ? (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center space-y-4">
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                status === "taken"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {status === "taken" ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {status === "taken" ? "Tomado!" : "Pulado"}
              </p>
              <p className="text-gray-400 text-sm">
                {status === "taken"
                  ? "Bom trabalho cuidando da sua saúde."
                  : "Tudo bem, segue para a próxima."}
              </p>
            </div>
            {onBack && (
              <button onClick={onBack} className="text-blue-400 text-sm font-medium">
                Voltar ao inicio →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => onTaken(note)}
              disabled={saving}
              className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 text-white rounded-2xl py-4 text-lg font-bold shadow-lg shadow-green-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Tomei agora
            </button>

            <button
              onClick={() => onSkipped(note)}
              disabled={saving}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-red-400 rounded-2xl py-3 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Pulei
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
