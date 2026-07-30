export type LifeStat = "intelligence" | "vitality" | "focus" | "discipline" | "perception";

export const statVisuals: Record<LifeStat, { color: string; label: string; shadow: string }> = {
  intelligence: {
    color: "#4fb7ff",
    label: "Intelligence",
    shadow: "rgba(79, 183, 255, 0.45)"
  },
  vitality: {
    color: "#3df59f",
    label: "Vitality",
    shadow: "rgba(61, 245, 159, 0.42)"
  },
  focus: {
    color: "#ff5c78",
    label: "Focus",
    shadow: "rgba(255, 92, 120, 0.42)"
  },
  discipline: {
    color: "#a88cff",
    label: "Discipline",
    shadow: "rgba(168, 140, 255, 0.42)"
  },
  perception: {
    color: "#f8f7ff",
    label: "Perception",
    shadow: "rgba(248, 247, 255, 0.36)"
  }
};

