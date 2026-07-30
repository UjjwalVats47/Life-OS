import { db } from "@/db/lifeOsDb";
import { currentLocalDbVersion } from "@/db/migrations";
import { nowIso } from "@/lib/dates";

export type ExportEnvelope = {
  app: "life-os";
  exportedAt: string;
  schemaVersion: typeof currentLocalDbVersion;
  version: 1;
  data: Record<string, unknown[]>;
};

export const exportableTables = [
  "aiInteractions",
  "appMeta",
  "commitments",
  "eventPrepItems",
  "events",
  "financeEntries",
  "freeBlocks",
  "goals",
  "habits",
  "identityPaths",
  "moodStressEntries",
  "notifications",
  "overrideAttempts",
  "personalityProfiles",
  "questSlotOptions",
  "questSlots",
  "rankSnapshots",
  "reflectionNotes",
  "resetPointLogs",
  "scheduleBlocks",
  "statLogs",
  "streaks",
  "systemInsights",
  "targetHabits",
  "taskAttempts",
  "taskTemplates",
  "userProfiles",
  "workItems",
  "xpLogs"
] as const;

export type ExportableTableName = (typeof exportableTables)[number];

export async function createLifeOsExport(): Promise<ExportEnvelope> {
  const data: ExportEnvelope["data"] = {};

  for (const tableName of exportableTables) {
    data[tableName] = await db.table(tableName).toArray();
  }

  return {
    app: "life-os",
    data,
    exportedAt: nowIso(),
    schemaVersion: currentLocalDbVersion,
    version: 1
  };
}

export function serializeLifeOsExport(envelope: ExportEnvelope) {
  return JSON.stringify(envelope, null, 2);
}

export function parseLifeOsExport(rawJson: string): ExportEnvelope {
  const parsed = JSON.parse(rawJson) as unknown;

  if (!isExportEnvelope(parsed)) {
    throw new Error("This file is not a valid Life OS export.");
  }

  if (parsed.schemaVersion !== currentLocalDbVersion) {
    throw new Error(`Export schema ${parsed.schemaVersion} cannot be restored into schema ${currentLocalDbVersion}.`);
  }

  return parsed;
}

export async function restoreLifeOsExport(envelope: ExportEnvelope) {
  await db.transaction("rw", db.tables, async () => {
    for (const tableName of exportableTables) {
      await db.table(tableName).clear();
    }

    for (const tableName of exportableTables) {
      const records = envelope.data[tableName] ?? [];
      if (records.length) await db.table(tableName).bulkPut(records);
    }
  });
}

export async function restoreLifeOsExportFromJson(rawJson: string) {
  const envelope = parseLifeOsExport(rawJson);
  await restoreLifeOsExport(envelope);
  return envelope;
}

export function getExportFileName(exportedAt = new Date()) {
  const stamp = exportedAt.toISOString().replace(/[:.]/g, "-");
  return `life-os-backup-${stamp}.json`;
}

function isExportEnvelope(value: unknown): value is ExportEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ExportEnvelope>;

  return (
    candidate.app === "life-os" &&
    candidate.version === 1 &&
    candidate.schemaVersion === currentLocalDbVersion &&
    typeof candidate.exportedAt === "string" &&
    Boolean(candidate.data) &&
    typeof candidate.data === "object" &&
    exportableTables.every((tableName) => Array.isArray(candidate.data?.[tableName]))
  );
}
