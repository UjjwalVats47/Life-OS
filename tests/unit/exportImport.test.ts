import { describe, expect, it } from "vitest";

import {
  exportableTables,
  getExportFileName,
  parseLifeOsExport,
  serializeLifeOsExport,
  type ExportEnvelope
} from "@/lib/exportImport";
import { currentLocalDbVersion } from "@/db/migrations";

function makeEnvelope(overrides: Partial<ExportEnvelope> = {}): ExportEnvelope {
  return {
    app: "life-os",
    data: Object.fromEntries(exportableTables.map((tableName) => [tableName, []])),
    exportedAt: "2026-07-29T00:00:00.000Z",
    schemaVersion: currentLocalDbVersion,
    version: 1,
    ...overrides
  };
}

describe("exportImport", () => {
  it("round-trips a valid Life OS export envelope", () => {
    const envelope = makeEnvelope({
      data: {
        ...makeEnvelope().data,
        goals: [{ id: "goal-1", title: "Build discipline" }]
      }
    });

    expect(parseLifeOsExport(serializeLifeOsExport(envelope))).toEqual(envelope);
  });

  it("rejects non-Life OS files and schema mismatches", () => {
    expect(() => parseLifeOsExport("{}")).toThrow("valid Life OS export");
    expect(() => parseLifeOsExport(JSON.stringify(makeEnvelope({ schemaVersion: 999 })))).toThrow(
      "valid Life OS export"
    );
  });

  it("upgrades schema 2 backups by adding an empty goal action plan collection", () => {
    const oldData = { ...makeEnvelope().data };
    delete oldData.goalActionFeedback;
    delete oldData.goalActionPlans;
    const restored = parseLifeOsExport(
      JSON.stringify(makeEnvelope({ data: oldData, schemaVersion: 2 }))
    );

    expect(restored.schemaVersion).toBe(currentLocalDbVersion);
    expect(restored.data.goalActionFeedback).toEqual([]);
    expect(restored.data.goalActionPlans).toEqual([]);
  });

  it("upgrades schema 3 backups by adding an empty generated-action feedback collection", () => {
    const oldData = { ...makeEnvelope().data };
    delete oldData.goalActionFeedback;
    const restored = parseLifeOsExport(
      JSON.stringify(makeEnvelope({ data: oldData, schemaVersion: 3 }))
    );

    expect(restored.schemaVersion).toBe(currentLocalDbVersion);
    expect(restored.data.goalActionFeedback).toEqual([]);
  });

  it("creates filesystem-safe backup names", () => {
    expect(getExportFileName(new Date("2026-07-29T12:34:56.789Z"))).toBe(
      "life-os-backup-2026-07-29T12-34-56-789Z.json"
    );
  });
});
