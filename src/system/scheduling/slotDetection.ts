import type { TimeBlock } from "@/system/scheduling/scheduleEngine";

export type FreeBlockDetectionOptions = {
  dayEndMinutes?: number;
  dayStartMinutes?: number;
  minimumBlockMinutes?: number;
};

export function detectFreeBlocks(blocks: TimeBlock[], options: FreeBlockDetectionOptions = {}) {
  const dayStart = options.dayStartMinutes ?? 0;
  const dayEnd = options.dayEndMinutes ?? 24 * 60;
  const minimum = options.minimumBlockMinutes ?? 15;

  if (dayEnd <= dayStart) {
    return [];
  }

  const occupied = blocks
    .map((block) => ({
      startMinutes: Math.max(dayStart, Math.min(dayEnd, block.startMinutes)),
      endMinutes: Math.max(dayStart, Math.min(dayEnd, block.endMinutes))
    }))
    .filter((block) => block.endMinutes > block.startMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

  const merged: TimeBlock[] = [];

  for (const block of occupied) {
    const previous = merged[merged.length - 1];

    if (previous && block.startMinutes <= previous.endMinutes) {
      previous.endMinutes = Math.max(previous.endMinutes, block.endMinutes);
    } else {
      merged.push({ ...block });
    }
  }

  const freeBlocks: TimeBlock[] = [];
  let cursor = dayStart;

  for (const block of merged) {
    if (block.startMinutes - cursor >= minimum) {
      freeBlocks.push({ startMinutes: cursor, endMinutes: block.startMinutes });
    }
    cursor = Math.max(cursor, block.endMinutes);
  }

  if (dayEnd - cursor >= minimum) {
    freeBlocks.push({ startMinutes: cursor, endMinutes: dayEnd });
  }

  return freeBlocks;
}
