export type TimeBlock = {
  endMinutes: number;
  startMinutes: number;
};

export function getDurationMinutes(block: TimeBlock) {
  return Math.max(0, block.endMinutes - block.startMinutes);
}

export type FlexibleDuration = {
  id: string;
  locked?: boolean;
  maximumMinutes: number;
  minimumMinutes: number;
  preferredMinutes: number;
};

export function adjustFlexibleDurations(tasks: FlexibleDuration[], availableMinutes: number) {
  const result = tasks.map((task) => ({
    id: task.id,
    minutes: clamp(task.preferredMinutes, task.minimumMinutes, task.maximumMinutes)
  }));
  let delta = Math.round(availableMinutes) - result.reduce((sum, task) => sum + task.minutes, 0);

  if (delta === 0) {
    return result;
  }

  for (let index = result.length - 1; index >= 0 && delta !== 0; index -= 1) {
    const source = tasks[index];
    const current = result[index];

    if (source.locked) continue;

    const capacity =
      delta > 0 ? source.maximumMinutes - current.minutes : current.minutes - source.minimumMinutes;
    const adjustment = Math.min(Math.abs(delta), Math.max(0, capacity));

    if (adjustment > 0) {
      const signedAdjustment = delta > 0 ? adjustment : -adjustment;
      current.minutes += signedAdjustment;
      delta -= signedAdjustment;
    }
  }

  return result;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}
