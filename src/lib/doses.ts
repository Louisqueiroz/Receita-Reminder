import type { Dose } from "./types";

export function generateDosesForDays(
  userId: string,
  medicineId: string,
  times: string[],
  startDate: string,
  days: number
): Omit<Dose, "id">[] {
  const doses: Omit<Dose, "id">[] = [];
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const day = new Date(start);
    day.setDate(day.getDate() + d);

    for (const time of times) {
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = new Date(day);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Skip doses in the past
      if (scheduledAt <= now) continue;

      doses.push({
        userId,
        medicineId,
        scheduledAt,
        status: "pending",
        notificationSent: false,
        followUpSent: false,
      });
    }
  }

  return doses;
}

export function inferDoseCount(frequency: string): number {
  if (!frequency) return 1;
  const f = frequency.toLowerCase();
  if (f.includes("6/6") || f.includes("4x") || f.includes("4 x")) return 4;
  if (f.includes("8/8") || f.includes("3x") || f.includes("3 x")) return 3;
  if (f.includes("12/12") || f.includes("2x") || f.includes("2 x")) return 2;
  return 1;
}

export function defaultTimesForCount(count: number): string[] {
  switch (count) {
    case 1:
      return ["09:00"];
    case 2:
      return ["09:00", "21:00"];
    case 3:
      return ["08:00", "14:00", "20:00"];
    case 4:
      return ["08:00", "13:00", "18:00", "23:00"];
    default: {
      if (count <= 0) return ["09:00"];
      const start = 8;
      const end = 23;
      const step = count === 1 ? 0 : (end - start) / (count - 1);
      return Array.from({ length: count }, (_, i) => {
        const hour = Math.round(start + step * i);
        return `${String(hour).padStart(2, "0")}:00`;
      });
    }
  }
}

export function parseDurationToDays(duration: string): number | null {
  if (duration === "uso continuo" || duration === "nao encontrado") {
    return null;
  }

  const match = duration.match(/(\d+)\s*dias?/i);
  if (match) return parseInt(match[1], 10);

  const monthMatch = duration.match(/(\d+)\s*mes(es)?/i);
  if (monthMatch) return parseInt(monthMatch[1], 10) * 30;

  return null;
}
