export type TaskCandidate = {
  deadlinePressure: number;
  estimatedMinutes: number;
  id: string;
  postponementCount: number;
  preferredTimeMatch: number;
  priorityWeight: number;
  routine?: boolean;
  weakArea?: boolean;
};

export type ScoredTaskCandidate = TaskCandidate & {
  score: number;
  systemReason: string;
};

export function scoreTaskCandidate(candidate: TaskCandidate, slotMinutes: number): ScoredTaskCandidate {
  const fitsSlot = candidate.estimatedMinutes <= slotMinutes;
  const durationFit = fitsSlot ? 10 * (candidate.estimatedMinutes / Math.max(1, slotMinutes)) : -100;
  const score =
    candidate.priorityWeight * 0.4 +
    clamp01(candidate.deadlinePressure) * 25 +
    Math.min(4, Math.max(0, candidate.postponementCount)) * 5 +
    clamp01(candidate.preferredTimeMatch) * 10 +
    durationFit +
    (candidate.weakArea ? 8 : 0) +
    (candidate.routine ? 5 : 0);

  const reasons = [
    candidate.deadlinePressure >= 0.7 ? "deadline pressure" : null,
    candidate.postponementCount >= 2 ? "repeated postponement" : null,
    candidate.weakArea ? "weak-area growth" : null,
    candidate.routine ? "routine consistency" : null,
    fitsSlot ? "fits available time" : "does not fit slot"
  ].filter(Boolean);

  return {
    ...candidate,
    score: Math.round(score * 100) / 100,
    systemReason: reasons.join(", ")
  };
}

export function selectBestTaskOptions(candidates: TaskCandidate[], slotMinutes: number, limit = 2) {
  return candidates
    .map((candidate) => scoreTaskCandidate(candidate, slotMinutes))
    .filter((candidate) => candidate.estimatedMinutes <= slotMinutes)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, limit));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
