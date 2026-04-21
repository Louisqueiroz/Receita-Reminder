"use client";

import { useState } from "react";
import TimePicker from "./TimePicker";
import { defaultTimesForCount } from "@/lib/doses";

interface SchedulePickerProps {
  times: string[];
  onChange: (times: string[]) => void;
}

const PRESET_COUNTS = [1, 2, 3, 4] as const;

function matchesPreset(times: string[]): number | null {
  for (const c of PRESET_COUNTS) {
    const preset = defaultTimesForCount(c);
    if (
      times.length === preset.length &&
      times.every((t, i) => t === preset[i])
    ) {
      return c;
    }
  }
  return null;
}

export default function SchedulePicker({ times, onChange }: SchedulePickerProps) {
  const matched = matchesPreset(times);
  const [mode, setMode] = useState<"auto" | "custom">(
    matched !== null ? "auto" : "custom"
  );
  const [count, setCount] = useState<number>(
    matched ?? Math.max(1, times.length || 1)
  );

  function selectCount(n: number) {
    setCount(n);
    onChange(defaultTimesForCount(n));
  }

  function switchMode(next: "auto" | "custom") {
    if (next === mode) return;
    setMode(next);
    if (next === "auto") {
      onChange(defaultTimesForCount(count));
    }
  }

  const autoTimes = defaultTimesForCount(count);

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg bg-gray-900 p-1 text-sm border border-gray-700">
        <button
          type="button"
          onClick={() => switchMode("auto")}
          className={`px-3 py-1.5 rounded-md font-medium transition ${
            mode === "auto"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Automatico
        </button>
        <button
          type="button"
          onClick={() => switchMode("custom")}
          className={`px-3 py-1.5 rounded-md font-medium transition ${
            mode === "custom"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:text-white"
          }`}
        >
          Horario especifico
        </button>
      </div>

      {mode === "auto" ? (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {PRESET_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => selectCount(n)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                  count === n
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-900 border-gray-700 text-gray-300 hover:text-white"
                }`}
              >
                {n}x ao dia
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {autoTimes.map((t, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full bg-gray-800 text-gray-100 text-sm font-mono border border-gray-700"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Voce recebera {count === 1 ? "um lembrete" : `${count} lembretes`} por dia nesses horarios.
          </p>
        </div>
      ) : (
        <TimePicker times={times} onChange={onChange} />
      )}
    </div>
  );
}
