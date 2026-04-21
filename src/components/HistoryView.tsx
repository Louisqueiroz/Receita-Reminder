"use client";

import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import type { Dose } from "@/lib/types";

export interface DoseWithMedicine extends Dose {
  medicineName: string;
  medicineDosage: string;
}

type DayStatus = "all-taken" | "any-missed" | "any-pending" | "future" | "empty";

interface DaySummary {
  key: string;
  date: Date;
  doses: DoseWithMedicine[];
  taken: number;
  skipped: number;
  pending: number;
  status: DayStatus;
}

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_LABELS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function toDate(val: unknown): Date {
  return val instanceof Timestamp ? val.toDate() : new Date(val as string);
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDayLong(d: Date): string {
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dayMonth = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} · ${dayMonth}`;
}

function summaryStatus(
  taken: number,
  skipped: number,
  pending: number,
  date: Date,
  now: Date
): DayStatus {
  if (taken === 0 && skipped === 0 && pending === 0) return "empty";
  if (skipped > 0) return "any-missed";
  if (pending > 0) {
    return startOfDay(date).getTime() > startOfDay(now).getTime() ? "future" : "any-pending";
  }
  return "all-taken";
}

function dotClass(status: DayStatus): string {
  if (status === "all-taken") return "bg-green-500";
  if (status === "any-missed") return "bg-red-500";
  if (status === "any-pending") return "bg-yellow-500";
  if (status === "future") return "bg-gray-500";
  return "bg-transparent";
}

const statusBg: Record<DayStatus, string> = {
  "all-taken": "bg-green-500",
  "any-missed": "bg-red-500",
  "any-pending": "bg-yellow-500",
  future: "bg-gray-500",
  empty: "bg-gray-700",
};

const statusLabel: Record<DayStatus, string> = {
  "all-taken": "Em dia",
  "any-missed": "Pulou",
  "any-pending": "Pendente",
  future: "Agendado",
  empty: "Sem registros",
};

interface HistoryViewProps {
  doses: DoseWithMedicine[];
  loading?: boolean;
}

export default function HistoryView({ doses, loading = false }: HistoryViewProps) {
  const [selectedKey, setSelectedKey] = useState<string>(() => dayKey(new Date()));
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  const { summaryByKey, totals } = useMemo(() => {
    const now = new Date();
    const byKey = new Map<string, DoseWithMedicine[]>();
    for (const dose of doses) {
      const d = toDate(dose.scheduledAt);
      const k = dayKey(d);
      const arr = byKey.get(k) ?? [];
      arr.push(dose);
      byKey.set(k, arr);
    }

    const summaryMap = new Map<string, DaySummary>();
    let runningTaken = 0;
    let runningSkipped = 0;
    for (const [key, dayDoses] of byKey.entries()) {
      const sorted = dayDoses.slice().sort(
        (a, b) => toDate(a.scheduledAt).getTime() - toDate(b.scheduledAt).getTime()
      );
      const taken = sorted.filter((x) => x.status === "taken").length;
      const skipped = sorted.filter((x) => x.status === "skipped").length;
      const pending = sorted.filter((x) => x.status === "pending").length;
      const date = toDate(sorted[0].scheduledAt);
      summaryMap.set(key, {
        key,
        date: startOfDay(date),
        doses: sorted,
        taken,
        skipped,
        pending,
        status: summaryStatus(taken, skipped, pending, date, now),
      });
      runningTaken += taken;
      runningSkipped += skipped;
    }

    return {
      summaryByKey: summaryMap,
      totals: { taken: runningTaken, skipped: runningSkipped },
    };
  }, [doses]);

  const calendarCells = useMemo(() => {
    const first = new Date(viewMonth.year, viewMonth.month, 1);
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - first.getDay());
    const cells: { date: Date; inMonth: boolean; key: string; summary: DaySummary | null }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const key = dayKey(d);
      cells.push({
        date: d,
        inMonth: d.getMonth() === viewMonth.month,
        key,
        summary: summaryByKey.get(key) ?? null,
      });
    }
    // Trim trailing all-out-of-month rows.
    while (cells.length > 35 && cells.slice(-7).every((c) => !c.inMonth)) {
      cells.length -= 7;
    }
    return cells;
  }, [viewMonth, summaryByKey]);

  const todayKey = dayKey(new Date());
  const selectedDay = summaryByKey.get(selectedKey) ?? null;

  const goPrev = () => {
    const m = viewMonth.month - 1;
    const newMonth = m < 0 ? { year: viewMonth.year - 1, month: 11 } : { year: viewMonth.year, month: m };
    setViewMonth(newMonth);
  };
  const goNext = () => {
    const m = viewMonth.month + 1;
    const newMonth = m > 11 ? { year: viewMonth.year + 1, month: 0 } : { year: viewMonth.year, month: m };
    setViewMonth(newMonth);
  };

  if (loading) return <p className="text-gray-400 text-center">Carregando...</p>;

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={goPrev}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-700"
            aria-label="Mês anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="text-white text-sm font-semibold tabular-nums">
            {MONTH_LABELS_FULL[viewMonth.month]} {viewMonth.year}
          </h2>
          <button
            type="button"
            onClick={goNext}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-700"
            aria-label="Próximo mês"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((d, i) => (
            <span key={i} className="text-[10px] text-gray-500 text-center uppercase">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((c) => {
            const isToday = c.key === todayKey;
            const isSelected = c.key === selectedKey;
            const status = c.summary?.status ?? "empty";
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedKey(c.key)}
                disabled={!c.inMonth}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-colors ${
                  !c.inMonth
                    ? "opacity-25"
                    : isSelected
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : isToday
                    ? "bg-gray-700 ring-1 ring-white/30"
                    : "bg-gray-700/40 hover:bg-gray-700"
                }`}
                aria-label={`${c.date.toLocaleDateString("pt-BR")}: ${statusLabel[status]}`}
              >
                <span
                  className={`text-sm font-medium tabular-nums ${
                    isSelected ? "text-white" : c.inMonth ? "text-gray-100" : "text-gray-500"
                  }`}
                >
                  {c.date.getDate()}
                </span>
                {c.summary && c.summary.doses.length > 0 && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${dotClass(status)}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Em dia
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Pulou
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Pendente
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Agendado
            </span>
          </div>
          <span className="tabular-nums whitespace-nowrap">
            {totals.taken}✓ · {totals.skipped}✗
          </span>
        </div>
      </div>

      {selectedDay && (
        <div className="bg-gray-700 border border-gray-600 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-semibold">
                {formatDayLong(selectedDay.date)}
                {selectedDay.key === todayKey && (
                  <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full align-middle">
                    hoje
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedDay.doses.length === 0
                  ? "Sem doses"
                  : `${selectedDay.taken} tomados · ${selectedDay.skipped} pulados · ${selectedDay.pending} pendentes`}
              </p>
            </div>
            <span
              className={`text-[11px] text-white px-2 py-1 rounded-full ${statusBg[selectedDay.status]}`}
            >
              {statusLabel[selectedDay.status]}
            </span>
          </div>

          {selectedDay.doses.length === 0 ? (
            <p className="text-gray-500 text-sm italic py-6 text-center">
              Nenhuma dose neste dia.
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedDay.doses.map((dose) => {
                const time = formatTime(toDate(dose.scheduledAt));
                const note = dose.note?.trim();
                return (
                  <li
                    key={dose.id}
                    className="bg-gray-800 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <DoseStatusIcon status={dose.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">
                          {dose.medicineName}
                          {dose.medicineDosage && (
                            <span className="text-gray-400">
                              {" "}· {dose.medicineDosage}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-gray-300 text-xs tabular-nums">
                        {time}
                      </span>
                    </div>
                    {note && (
                      <div className="mt-2 ml-9 flex gap-2 text-xs text-gray-300 bg-gray-900/60 border-l-2 border-blue-500/60 rounded px-2 py-1.5">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 flex-shrink-0 text-blue-400"
                          aria-hidden
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <p className="whitespace-pre-wrap break-words leading-snug">
                          {note}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

export function getStartDateFromDoses(doses: DoseWithMedicine[]): Date | null {
  let earliest: Date | null = null;
  for (const dose of doses) {
    const d = toDate(dose.scheduledAt);
    const dayStart = startOfDay(d);
    if (!earliest || dayStart.getTime() < earliest.getTime()) earliest = dayStart;
  }
  return earliest;
}

function DoseStatusIcon({ status }: { status: Dose["status"] }) {
  if (status === "taken") {
    return (
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-600 text-gray-300 flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    </span>
  );
}
