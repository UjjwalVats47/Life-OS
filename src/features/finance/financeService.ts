import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import type { LifeDomain } from "@/types/enums";

export type ExpenseInput = {
  amount: number;
  category: string;
  domain?: LifeDomain;
  goalId?: string;
  mood?: number;
  note?: string;
  stress?: number;
};

export async function addExpense(input: ExpenseInput) {
  const timestamp = nowIso();
  const userId = defaultUserProfileId;
  const moodStressId =
    input.mood !== undefined || input.stress !== undefined ? createId() : undefined;

  await db.transaction("rw", [db.financeEntries, db.moodStressEntries], async () => {
    if (moodStressId) {
      await db.moodStressEntries.put({
        createdAt: timestamp,
        date: timestamp.slice(0, 10),
        id: moodStressId,
        mood: input.mood ?? 5,
        stress: input.stress ?? 5,
        triggerType: "expense",
        updatedAt: timestamp,
        userId
      });
    }
    await db.financeEntries.put({
      amount: Math.round(input.amount * 100) / 100,
      category: input.category.trim(),
      createdAt: timestamp,
      currency: "INR",
      date: timestamp.slice(0, 10),
      domain: input.domain,
      goalId: input.goalId,
      id: createId(),
      moodStressEntryId: moodStressId,
      note: input.note?.trim() || undefined,
      updatedAt: timestamp,
      userId
    });
  });
}

export async function loadFinanceDashboard() {
  const userId = defaultUserProfileId;
  const weekStart = Date.now() - 7 * 86_400_000;
  const entries = await db.financeEntries
    .where("userId")
    .equals(userId)
    .filter((entry) => new Date(entry.createdAt).getTime() >= weekStart)
    .toArray();
  const moods = await db.moodStressEntries.where("userId").equals(userId).toArray();
  const goals = await db.goals.where("userId").equals(userId).toArray();
  const byCategory = entries.reduce<Record<string, number>>((summary, entry) => {
    summary[entry.category] = (summary[entry.category] ?? 0) + entry.amount;
    return summary;
  }, {});
  const stressLinked = entries.filter((entry) => {
    const mood = moods.find((item) => item.id === entry.moodStressEntryId);
    return mood && mood.stress >= 7;
  });

  return {
    byCategory,
    entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    goals,
    stressLinkedAmount: stressLinked.reduce((sum, entry) => sum + entry.amount, 0),
    total: entries.reduce((sum, entry) => sum + entry.amount, 0)
  };
}
