import type { LifeDomain, StatName } from "@/types/enums";

export type HabitSuggestion = {
  difficulty: "easy" | "normal";
  domain: LifeDomain;
  frequency: string;
  goal: string;
  stats: StatName[];
  title: string;
};

const starterHabitByDomain: Record<LifeDomain, HabitSuggestion> = {
  academics: {
    difficulty: "normal",
    domain: "academics",
    frequency: "5 days per week",
    goal: "Build reliable academic preparation",
    stats: ["intelligence", "focus"],
    title: "Focused study block"
  },
  discipline_routine: {
    difficulty: "easy",
    domain: "discipline_routine",
    frequency: "daily",
    goal: "Create visible proof of planned execution",
    stats: ["discipline", "focus"],
    title: "Start the first planned block on time"
  },
  finance: {
    difficulty: "easy",
    domain: "finance",
    frequency: "daily",
    goal: "Replace vague spending awareness with evidence",
    stats: ["perception", "discipline"],
    title: "Log each expense"
  },
  fitness_health: {
    difficulty: "normal",
    domain: "fitness_health",
    frequency: "4 days per week",
    goal: "Build energy and physical consistency",
    stats: ["vitality", "discipline"],
    title: "Complete a movement session"
  },
  personality_social_confidence: {
    difficulty: "easy",
    domain: "personality_social_confidence",
    frequency: "3 days per week",
    goal: "Increase social initiative through controlled exposure",
    stats: ["perception", "discipline"],
    title: "Complete one deliberate social confidence rep"
  },
  skills_career: {
    difficulty: "normal",
    domain: "skills_career",
    frequency: "5 days per week",
    goal: "Produce evidence of career-relevant skill growth",
    stats: ["intelligence", "focus"],
    title: "Complete one focused skill block"
  }
};

export function generateStarterHabits(domains: LifeDomain[], limit = 4) {
  return [...new Set(domains)]
    .map((domain) => starterHabitByDomain[domain])
    .slice(0, Math.max(0, limit));
}
