import type { Goal, Habit } from "@/types/domain";
import type { LifeDomain } from "@/types/enums";

export type FirstWeekProtocolDay = {
  date: string;
  focus: LifeDomain | "recovery";
  intensity: "observe" | "light" | "standard" | "review";
  maxPriorityQuests: number;
  notes: string[];
};

export type FirstWeekProtocol = {
  createdForIdentity: string;
  days: FirstWeekProtocolDay[];
  evidenceRules: string[];
  userId: string;
};

export function createFirstWeekProtocol(input: {
  goals: Goal[];
  habits: Habit[];
  identityName: string;
  startDate: string;
  userId: string;
}): FirstWeekProtocol {
  const rankedDomains = getRankedDomains(input.goals, input.habits);

  return {
    createdForIdentity: input.identityName,
    days: Array.from({ length: 7 }, (_, index) => {
      const focus = index === 6 ? "recovery" : rankedDomains[index % rankedDomains.length];
      return {
        date: addDays(input.startDate, index),
        focus,
        intensity: getIntensity(index),
        maxPriorityQuests: index < 2 ? 2 : index < 5 ? 3 : 4,
        notes: getDayNotes(index, focus)
      };
    }),
    evidenceRules: [
      "Track completion, postponement, reason quality, and time drift before increasing strictness.",
      "Treat fixed blocks as reality anchors; only flexible commitments can be reshaped automatically.",
      "Prefer one identity-confirming action per important domain over many low-value tasks."
    ],
    userId: input.userId
  };
}

function getRankedDomains(goals: Goal[], habits: Habit[]) {
  const scores = new Map<LifeDomain, number>();

  for (const goal of goals) {
    const weight = goal.level === "primary" ? 5 : goal.level === "secondary" ? 3 : 1;
    scores.set(goal.domain, (scores.get(goal.domain) ?? 0) + weight + goal.priorityWeight / 100);
  }

  for (const habit of habits) {
    scores.set(habit.domain, (scores.get(habit.domain) ?? 0) + 1);
  }

  const ranked = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).map(([domain]) => domain);

  return ranked.length ? ranked : (["discipline_routine"] as LifeDomain[]);
}

function getIntensity(index: number): FirstWeekProtocolDay["intensity"] {
  if (index === 0) return "observe";
  if (index <= 2) return "light";
  if (index <= 5) return "standard";
  return "review";
}

function getDayNotes(index: number, focus: FirstWeekProtocolDay["focus"]) {
  if (index === 0) {
    return ["Capture real timings and skip reasons before changing the plan."];
  }

  if (focus === "recovery") {
    return ["Run review, protect evening recovery, and carry only deadline-critical leftovers."];
  }

  return [
    `Build proof for ${focus.split("_").join(" ")}.`,
    "Adjust flexible durations only inside their minimum and maximum bounds."
  ];
}

function addDays(startDate: string, days: number) {
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}
