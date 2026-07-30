export const rankThresholds = [
  { rank: "E", xp: 0 },
  { rank: "D", xp: 300 },
  { rank: "C", xp: 900 },
  { rank: "B", xp: 2_000 },
  { rank: "A", xp: 4_000 },
  { rank: "Elite", xp: 7_000 },
  { rank: "Knight", xp: 11_000 },
  { rank: "Commander", xp: 16_000 },
  { rank: "S", xp: 23_000 },
  { rank: "General", xp: 32_000 },
  { rank: "Monarch", xp: 45_000 }
] as const;

export const defaultStats = {
  intelligence: 1,
  vitality: 1,
  focus: 1,
  discipline: 1,
  perception: 1
} as const;
