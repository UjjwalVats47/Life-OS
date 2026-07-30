import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { ruleBasedAdapter } from "@/system/ai/ruleBasedAdapter";
import type { AiMode, SystemTone } from "@/types/enums";

export type ChatMessage = {
  createdAt: string;
  id: string;
  role: "user" | "system";
  text: string;
};

const chatHistoryMetaId = "system-chat-history";

export async function loadSystemChat() {
  const meta = await db.appMeta.get(chatHistoryMetaId);
  const value = meta?.value;

  return isChatHistory(value) ? value : [];
}

export async function sendSystemChatMessage(input: string, tone: SystemTone) {
  const trimmed = input.trim();
  if (!trimmed) return loadSystemChat();

  const timestamp = nowIso();
  const history = await loadSystemChat();
  const contextSummary = await createLocalContextSummary();
  const userMessage: ChatMessage = {
    createdAt: timestamp,
    id: createId(),
    role: "user",
    text: trimmed
  };
  const response = await ruleBasedAdapter.complete({
    contextType: "system_chat",
    contextSummary,
    input: trimmed,
    mode: "rule_based",
    tone
  });
  const systemMessage: ChatMessage = {
    createdAt: nowIso(),
    id: createId(),
    role: "system",
    text: response.output
  };
  const nextHistory = [...history, userMessage, systemMessage].slice(-24);

  await db.transaction("rw", [db.aiInteractions, db.appMeta], async () => {
    await db.aiInteractions.put({
      contextType: "system_chat",
      createdAt: systemMessage.createdAt,
      id: createId(),
      inputSummary: trimmed.slice(0, 140),
      mode: "rule_based" satisfies AiMode,
      outputText: response.output,
      tone,
      userId: defaultUserProfileId
    });
    await db.appMeta.put({
      createdAt: timestamp,
      id: chatHistoryMetaId,
      key: "systemChatHistory",
      updatedAt: nowIso(),
      value: nextHistory
    });
  });

  return nextHistory;
}

async function createLocalContextSummary() {
  const [activeGoals, activeHabits, pendingQuestSlots, plannedEvents] = await Promise.all([
    db.goals.where("status").equals("active").count(),
    db.habits.where("status").equals("active").count(),
    db.questSlots.where("status").anyOf(["pending", "active"]).count(),
    db.events.where("status").anyOf(["planned", "active"]).count()
  ]);

  return `${activeGoals} active goals, ${activeHabits} active habits, ${pendingQuestSlots} pending quest slots, ${plannedEvents} planned events.`;
}

function isChatHistory(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (message) =>
        message &&
        typeof message === "object" &&
        "id" in message &&
        "role" in message &&
        "text" in message &&
        "createdAt" in message &&
        (message.role === "user" || message.role === "system") &&
        typeof message.text === "string"
    )
  );
}
