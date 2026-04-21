"use client";

interface DoseButtonsProps {
  onTaken: () => void;
  onSkipped: () => void;
  loading: boolean;
}

export default function DoseButtons({ onTaken, onSkipped, loading }: DoseButtonsProps) {
  return (
    <div className="flex gap-4">
      <button
        onClick={onTaken}
        disabled={loading}
        className="flex-1 bg-green-500 text-white rounded-xl p-4 text-lg font-bold disabled:opacity-50"
      >
        Tomei
      </button>
      <button
        onClick={onSkipped}
        disabled={loading}
        className="flex-1 bg-red-400 text-white rounded-xl p-4 text-lg font-bold disabled:opacity-50"
      >
        Pulei
      </button>
    </div>
  );
}
