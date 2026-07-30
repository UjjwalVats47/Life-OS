import { db } from "@/db/lifeOsDb";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import type { AiMode } from "@/types/enums";

export type AiSettings = {
  externalAiEnabled: boolean;
  localAiEnabled: boolean;
  localModel: string;
  mode: AiMode;
  ollamaBaseUrl: string;
};

export type PwaStatus = {
  displayMode: "browser" | "standalone";
  hasManifest: boolean;
  hasServiceWorker: boolean;
  notificationPermission: NotificationPermission | "unsupported";
};

const aiSettingsMetaId = "settings-ai-mode";

export async function loadAiSettings(): Promise<AiSettings> {
  const meta = await db.appMeta.get(aiSettingsMetaId);
  const value = meta?.value;

  if (isAiSettings(value)) return value;

  return {
    externalAiEnabled: false,
    localAiEnabled: false,
    localModel: "phi3:latest",
    mode: "rule_based",
    ollamaBaseUrl: "http://127.0.0.1:11434"
  };
}

export async function saveAiSettings(settings: AiSettings) {
  const timestamp = nowIso();

  await db.appMeta.put({
    createdAt: timestamp,
    id: aiSettingsMetaId,
    key: "aiSettings",
    updatedAt: timestamp,
    value: {
      externalAiEnabled: settings.externalAiEnabled,
      localAiEnabled: settings.localAiEnabled,
      localModel: settings.localModel,
      mode: settings.localAiEnabled ? "local_ai" : settings.externalAiEnabled ? "external_ai" : "rule_based",
      ollamaBaseUrl: settings.ollamaBaseUrl
    }
  });
}

export function getPwaStatus(): PwaStatus {
  const hasServiceWorker = "serviceWorker" in navigator;
  const notificationPermission =
    "Notification" in window ? Notification.permission : "unsupported";
  const displayMode = window.matchMedia("(display-mode: standalone)").matches
    ? "standalone"
    : "browser";

  return {
    displayMode,
    hasManifest: Boolean(document.querySelector('link[rel="manifest"]')),
    hasServiceWorker,
    notificationPermission
  };
}

export async function requestReminderPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  return Notification.requestPermission();
}

export async function seedCoreReminders(userId: string) {
  const timestamp = nowIso();
  const today = timestamp.slice(0, 10);
  const existing = await db.notifications
    .where("userId")
    .equals(userId)
    .filter((notification) => notification.createdAt.slice(0, 10) === today)
    .toArray();

  if (existing.length) return existing;

  const reminders = [
    {
      body: "Review the current quest board and protect the first important slot.",
      notificationType: "task_start" as const,
      scheduledAt: atLocalTime(8, 0),
      title: "Quest board check"
    },
    {
      body: "Log unfinished work, mood, stress, and one useful correction for tomorrow.",
      notificationType: "end_of_day_reflection" as const,
      scheduledAt: atLocalTime(21, 30),
      title: "End-of-day reflection"
    },
    {
      body: "Run the two-review discipline checkpoint if enough behavior data exists.",
      notificationType: "weekly_review" as const,
      scheduledAt: nextSundayAt(18, 0),
      title: "Discipline review"
    }
  ].map((reminder) => ({
    ...reminder,
    createdAt: timestamp,
    id: createId(),
    status: "scheduled" as const,
    updatedAt: timestamp,
    userId
  }));

  await db.notifications.bulkPut(reminders);
  return reminders;
}

function atLocalTime(hours: number, minutes: number) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() < Date.now()) date.setDate(date.getDate() + 1);

  return date.toISOString();
}

function nextSundayAt(hours: number, minutes: number) {
  const date = new Date();
  const daysUntilSunday = (7 - date.getDay()) % 7;
  date.setDate(date.getDate() + daysUntilSunday);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() < Date.now()) date.setDate(date.getDate() + 7);

  return date.toISOString();
}

function isAiSettings(value: unknown): value is AiSettings {
  if (!value || typeof value !== "object") return false;

  if (!("externalAiEnabled" in value) || !("mode" in value)) return false;
  if (typeof value.externalAiEnabled !== "boolean") return false;
  if (value.mode !== "rule_based" && value.mode !== "local_ai" && value.mode !== "external_ai") return false;

  const settings = value as Partial<AiSettings>;
  settings.localAiEnabled = settings.localAiEnabled ?? false;
  settings.localModel = settings.localModel ?? "phi3:latest";
  settings.ollamaBaseUrl = settings.ollamaBaseUrl ?? "http://127.0.0.1:11434";
  return true;
}
