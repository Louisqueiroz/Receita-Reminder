"use client";

interface TimePickerProps {
  times: string[];
  onChange: (times: string[]) => void;
}

export default function TimePicker({ times, onChange }: TimePickerProps) {
  function addTime() {
    onChange([...times, "08:00"]);
  }

  function removeTime(index: number) {
    onChange(times.filter((_, i) => i !== index));
  }

  function updateTime(index: number, value: string) {
    onChange(times.map((t, i) => (i === index ? value : t)));
  }

  return (
    <div className="space-y-2">
      {times.map((time, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => updateTime(i, e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-lg text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
          />
          <button
            onClick={() => removeTime(i)}
            className="text-red-400 hover:text-red-300 px-3 py-2"
          >
            X
          </button>
        </div>
      ))}
      {times.length === 0 && (
        <p className="text-sm text-gray-400">
          Nenhum horario definido — voce nao recebera lembretes para este remedio.
        </p>
      )}
      <button
        onClick={addTime}
        className="text-blue-400 hover:text-blue-300 text-sm font-medium py-2"
      >
        + Adicionar horario
      </button>
    </div>
  );
}
