import { adjustFlexibleDurations } from "@/system/scheduling/scheduleEngine";
import type { WorkItem } from "@/types/domain";

export type AdaptationMode = "tighten" | "normal" | "lighten";

export type AdaptedWorkItem = WorkItem & {
  adaptationReason?: string;
  adjustedMinutes: number;
};

export type BoundedAdaptationResult = {
  availableMinutes: number;
  items: AdaptedWorkItem[];
  mode: AdaptationMode;
  warnings: string[];
};

export function adaptWorkItemsToWindow(
  items: WorkItem[],
  availableMinutes: number,
  mode: AdaptationMode = "normal"
): BoundedAdaptationResult {
  const sorted = [...items].sort((a, b) => priorityScore(b) - priorityScore(a));
  const lockedMinutes = sorted
    .filter((item) => item.flexibility === "locked")
    .reduce((sum, item) => sum + item.plannedMinutes, 0);
  const flexibleItems = sorted.filter((item) => item.flexibility !== "locked");
  const warnings: string[] = [];

  if (lockedMinutes > availableMinutes) {
    warnings.push("Locked commitments exceed the available window. System cannot solve this without user reasoning.");
  }

  const remainingMinutes = Math.max(0, availableMinutes - lockedMinutes);
  const adjustedDurations = adjustFlexibleDurations(
    flexibleItems.map((item) => ({
      id: item.id,
      locked: item.flexibility === "locked",
      maximumMinutes: getModeMaximum(item, mode),
      minimumMinutes: getModeMinimum(item, mode),
      preferredMinutes: getModePreferred(item, mode)
    })),
    remainingMinutes
  );
  const durationById = new Map(adjustedDurations.map((item) => [item.id, item.minutes]));

  return {
    availableMinutes,
    items: sorted.map((item) => {
      const adjustedMinutes =
        item.flexibility === "locked" ? item.plannedMinutes : durationById.get(item.id) ?? item.plannedMinutes;
      const adaptationReason =
        adjustedMinutes === item.plannedMinutes
          ? undefined
          : adjustedMinutes < item.plannedMinutes
            ? "Compressed inside allowed bounds to protect the day structure."
            : "Expanded inside allowed bounds because the window had useful slack.";

      return {
        ...item,
        adaptationReason,
        adjustedMinutes
      };
    }),
    mode,
    warnings
  };
}

export function chooseAdaptationMode(input: {
  completionRate: number;
  deadlinePressure: number;
  postponementRate: number;
}): AdaptationMode {
  if (input.deadlinePressure >= 0.75 || input.postponementRate >= 0.35) return "tighten";
  if (input.completionRate >= 0.8 && input.postponementRate <= 0.1 && input.deadlinePressure < 0.5) return "lighten";
  return "normal";
}

function getModeMinimum(item: WorkItem, mode: AdaptationMode) {
  const base = item.minimumMinutes ?? Math.max(10, Math.round(item.preferredMinutes * 0.75));
  if (item.priority === "critical") return base;
  if (mode === "tighten") return Math.max(5, Math.round(base * 0.9));
  return base;
}

function getModePreferred(item: WorkItem, mode: AdaptationMode) {
  if (mode === "tighten" && item.priority !== "critical") return Math.max(getModeMinimum(item, mode), Math.round(item.preferredMinutes * 0.9));
  if (mode === "lighten" && item.kind === "recovery") return Math.min(getModeMaximum(item, mode), Math.round(item.preferredMinutes * 1.15));
  return item.preferredMinutes;
}

function getModeMaximum(item: WorkItem, mode: AdaptationMode) {
  const base = item.maximumMinutes ?? Math.round(item.preferredMinutes * 1.25);
  if (mode === "lighten" && item.kind === "recovery") return Math.round(base * 1.15);
  return base;
}

function priorityScore(item: WorkItem) {
  const priority = {
    critical: 400,
    high: 300,
    low: 100,
    normal: 200
  }[item.priority];
  const kindBonus = item.kind === "deadline_prep" ? 40 : item.kind === "fixed_commitment" ? 25 : 0;

  return priority + kindBonus + item.resetPointValue;
}
