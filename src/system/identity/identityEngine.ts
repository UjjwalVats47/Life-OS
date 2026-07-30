import type { LifeDomain } from "@/types/enums";

export type IdentityOption = {
  attacks: string[];
  intensity: "low" | "medium" | "high" | "extreme";
  name: string;
  pillars: LifeDomain[];
  rewards: string[];
  systemReason: string;
  transformationPromise: string;
};

export type IdentityGenerationContext = {
  confidence?: "low" | "medium" | "high";
  desiredDirection?: string;
};

export function createStarterIdentityOptions(
  domains: LifeDomain[],
  context: IdentityGenerationContext = {}
): IdentityOption[] {
  const uniqueDomains = [...new Set(domains)];
  const hasSkills = domains.includes("skills_career");
  const hasDiscipline = domains.includes("discipline_routine");
  const hasSocial = domains.includes("personality_social_confidence");
  const hasPerformance = domains.includes("academics") || domains.includes("fitness_health");
  const direction = context.desiredDirection?.trim();

  const primaryName =
    hasSkills && hasDiscipline
      ? "Disciplined Skill Builder"
      : "Focused Rebuilder";

  const candidates: IdentityOption[] = [
    {
      attacks: ["inconsistency", "scattered routines"],
      intensity: "high",
      name: primaryName,
      pillars: uniqueDomains.slice(0, 3),
      rewards: ["daily consistency", "on-time execution", "weak-area attempts"],
      systemReason: withDirection("Your selected goals emphasize structured identity change.", direction),
      transformationPromise: direction
        ? `Become reliable through repeated proof actions directed toward ${direction}.`
        : "Become reliable through repeated proof actions."
    }
  ];

  if (hasSocial) {
    candidates.push({
      attacks: ["avoidance", "low social initiative"],
      intensity: "medium",
      name: "Strategic Social Operator",
      pillars: ["personality_social_confidence", "discipline_routine"],
      rewards: ["social confidence reps", "reflection", "controlled exposure"],
      systemReason: "Social confidence is marked as a priority domain.",
      transformationPromise: "Build presence through deliberate social practice."
    });
  }

  if (hasPerformance) {
    candidates.push({
      attacks: ["mediocre preparation", "inconsistent physical energy"],
      intensity: "high",
      name: "Resilient High Performer",
      pillars: uniqueDomains.filter((domain) => domain === "academics" || domain === "fitness_health"),
      rewards: ["prepared work", "training consistency", "measurable improvement"],
      systemReason: withDirection("Academic or physical performance is central to the current goals.", direction),
      transformationPromise: "Build dependable performance through preparation, recovery, and repetition."
    });
  }

  candidates.push({
    attacks: ["drift", "reactive choices", "unfinished commitments"],
    intensity: "medium",
    name: "Focused Systems Operator",
    pillars: uniqueDomains.slice(0, 3),
    rewards: ["planned execution", "weekly review", "controlled flexibility"],
    systemReason: withDirection("This path balances structure with adaptive execution.", direction),
    transformationPromise: "Operate each week with deliberate priorities and visible evidence."
  });

  candidates.push({
    attacks: ["hesitation", "unmeasured effort", "weak follow-through"],
    intensity: "medium",
    name: "Adaptive Growth Strategist",
    pillars: uniqueDomains.slice(0, 3),
    rewards: ["measured experiments", "weekly adaptation", "completed proof actions"],
    systemReason: withDirection("This path suits an uncertain profile that needs evidence before stronger specialization.", direction),
    transformationPromise: "Use short improvement cycles to discover and reinforce the strongest identity direction."
  });

  const optionCount = context.confidence === "high" ? 2 : 3;

  return candidates
    .filter((option, index, all) => all.findIndex((candidate) => candidate.name === option.name) === index)
    .slice(0, optionCount);
}

function withDirection(reason: string, direction?: string) {
  return direction ? `${reason} Desired direction: ${direction}.` : reason;
}
