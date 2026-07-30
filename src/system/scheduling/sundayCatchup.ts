export type SundayTask = {
  deadlineRelated: boolean;
  estimatedMinutes: number;
  id: string;
  unfinished: boolean;
  urgency: number;
};

export type SundayMode = "deadline_priority" | "heavy_catchup" | "light_recovery";

export function createSundayPolicy(tasks: SundayTask[], weeklyCompletionRate: number) {
  const completionRate = Math.min(1, Math.max(0, weeklyCompletionRate));
  const deadlineCount = tasks.filter((task) => task.deadlineRelated).length;
  const unfinishedCount = tasks.filter((task) => task.unfinished).length;
  const mode: SundayMode =
    deadlineCount > 0
      ? "deadline_priority"
      : unfinishedCount >= 4 || completionRate < 0.7
        ? "heavy_catchup"
        : "light_recovery";
  const workBudgetMinutes = mode === "heavy_catchup" ? 300 : mode === "deadline_priority" ? 240 : 150;
  const orderedTaskIds = [...tasks]
    .sort((a, b) => {
      if (a.deadlineRelated !== b.deadlineRelated) return a.deadlineRelated ? -1 : 1;
      if (a.unfinished !== b.unfinished) return a.unfinished ? -1 : 1;
      if (b.urgency !== a.urgency) return b.urgency - a.urgency;
      return a.id.localeCompare(b.id);
    })
    .map((task) => task.id);

  return {
    eveningRestStartMinutes: 18 * 60,
    mode,
    orderedTaskIds,
    workBudgetMinutes
  };
}
