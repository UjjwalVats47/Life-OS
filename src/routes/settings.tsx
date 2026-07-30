import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bell, Brain, Database, Download, RefreshCcw, Smartphone, Upload } from "lucide-react";

import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import {
  getPwaStatus,
  loadAiSettings,
  requestReminderPermission,
  saveAiSettings,
  seedCoreReminders,
  type AiSettings,
  type PwaStatus
} from "@/features/settings/settingsService";
import {
  createLifeOsExport,
  getExportFileName,
  restoreLifeOsExportFromJson,
  serializeLifeOsExport
} from "@/lib/exportImport";
import { syncWorkItemsFromExistingData } from "@/system/work/workItemEngine";
import {
  checkOllamaConnection,
  type OllamaConnection
} from "@/system/ai/ollamaGoalTaskAdapter";

export function SettingsRoute() {
  const [pwaStatus, setPwaStatus] = useState<PwaStatus>();
  const [aiSettings, setAiSettings] = useState<AiSettings>({
    externalAiEnabled: false,
    localAiEnabled: false,
    localModel: "phi3:latest",
    mode: "rule_based",
    ollamaBaseUrl: "http://127.0.0.1:11434"
  });
  const [ollama, setOllama] = useState<OllamaConnection>({ available: false, models: [] });
  const [message, setMessage] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPwaStatus(getPwaStatus());
    void loadAiSettings().then(async (settings) => {
      setAiSettings(settings);
      setOllama(await checkOllamaConnection(settings.ollamaBaseUrl));
    });
  }, []);

  async function toggleExternalAi(enabled: boolean) {
    const nextSettings: AiSettings = {
      externalAiEnabled: enabled,
      localAiEnabled: false,
      localModel: aiSettings.localModel,
      mode: enabled ? "external_ai" : "rule_based",
      ollamaBaseUrl: aiSettings.ollamaBaseUrl
    };
    await saveAiSettings(nextSettings);
    setAiSettings(nextSettings);
    setMessage(
      enabled
        ? "External AI is enabled as a preference only. No provider is connected yet."
        : "External AI is off. Rule-based local System behavior remains active."
    );
  }

  async function toggleLocalAi(enabled: boolean) {
    if (!enabled) {
      const nextSettings = { ...aiSettings, localAiEnabled: false, mode: "rule_based" as const };
      await saveAiSettings(nextSettings);
      setAiSettings(nextSettings);
      setMessage("Local AI is off. Deterministic task generation remains active.");
      return;
    }

    const connection = await checkOllamaConnection(aiSettings.ollamaBaseUrl);
    setOllama(connection);
    if (!connection.available || !connection.models.length) {
      setMessage("Ollama is not reachable or has no installed model. Local AI was not enabled.");
      return;
    }
    const localModel = connection.models.includes(aiSettings.localModel)
      ? aiSettings.localModel
      : connection.models[0];
    const nextSettings: AiSettings = {
      ...aiSettings,
      externalAiEnabled: false,
      localAiEnabled: true,
      localModel,
      mode: "local_ai"
    };
    await saveAiSettings(nextSettings);
    setAiSettings(nextSettings);
    setMessage(`Local task refinement enabled with ${localModel}. Personal context stays on this device.`);
  }

  async function enableNotifications() {
    const permission = await requestReminderPermission();
    setPwaStatus(getPwaStatus());
    setMessage(`Notification permission: ${permission}.`);
  }

  async function createReminders() {
    const reminders = await seedCoreReminders(defaultUserProfileId);
    setMessage(`${reminders.length} local reminders are scheduled.`);
  }

  async function rebuildWorkModel() {
    const workItems = await syncWorkItemsFromExistingData(defaultUserProfileId);
    setMessage(`${workItems.length} shared work items rebuilt from local goals, habits, quests, schedule, and events.`);
  }

  async function exportLocalData() {
    const envelope = await createLifeOsExport();
    const blob = new Blob([serializeLifeOsExport(envelope)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getExportFileName(new Date(envelope.exportedAt));
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Local backup exported. Keep it somewhere safe; browser storage can still be cleared.");
  }

  async function importLocalData(file?: File) {
    if (!file) return;

    try {
      const rawJson = await file.text();
      const envelope = await restoreLifeOsExportFromJson(rawJson);
      setMessage(`Local backup restored from ${new Date(envelope.exportedAt).toLocaleString()}.`);
      window.setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <div className="system-panel rounded-sm p-5">
        <div className="system-panel-content">
          <p className="system-label text-xs font-semibold">Settings</p>
          <h1 className="system-title mt-3 text-2xl font-black text-slate-50">Local-first control.</h1>
        </div>
      </div>

      {message ? (
        <div className="rounded-sm border border-systemGreen/30 bg-systemGreen/10 px-4 py-3 text-sm text-systemGreen">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={<Smartphone className="size-5" />} title="PWA Status">
          <StatusRow label="Display mode" value={pwaStatus?.displayMode ?? "checking"} />
          <StatusRow label="Manifest" value={pwaStatus?.hasManifest ? "present" : "not detected"} />
          <StatusRow label="Service worker support" value={pwaStatus?.hasServiceWorker ? "supported" : "unsupported"} />
          <StatusRow label="Notifications" value={pwaStatus?.notificationPermission ?? "checking"} />
        </Panel>

        <Panel icon={<Bell className="size-5" />} title="Reminders">
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionButton label="Allow notifications" onClick={() => void enableNotifications()} />
            <ActionButton label="Create core reminders" onClick={() => void createReminders()} />
          </div>
          <div className="mt-4 grid gap-2 text-xs text-slate-400">
            <ReminderLine label="Morning" text="Quest board check" />
            <ReminderLine label="Evening" text="End-of-day reflection" />
            <ReminderLine label="Sunday" text="Two-review discipline checkpoint" />
          </div>
        </Panel>

        <Panel icon={<Brain className="size-5" />} title="AI Mode">
          <div className="mb-3 flex items-center justify-between gap-3 rounded-sm border border-systemGreen/20 bg-systemGreen/5 p-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">Local Ollama</p>
              <p className="mt-1 text-[10px] text-slate-500">
                {ollama.available ? ollama.models.join(", ") || "No models" : "Not connected"}
              </p>
            </div>
            <button
              aria-label="Toggle local Ollama"
              className={`h-7 w-12 rounded-full border p-1 transition ${
                aiSettings.localAiEnabled
                  ? "border-systemGreen/60 bg-systemGreen/30"
                  : "border-slate-600 bg-slate-900"
              }`}
              onClick={() => void toggleLocalAi(!aiSettings.localAiEnabled)}
              type="button"
            >
              <span
                className={`block size-4 rounded-full bg-slate-50 transition ${
                  aiSettings.localAiEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-sm border border-systemBlue/15 bg-black/25 p-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">External AI</p>
            </div>
            <button
              className={`h-7 w-12 rounded-full border p-1 transition ${
                aiSettings.externalAiEnabled
                  ? "border-systemBlue/60 bg-systemBlue/40"
                  : "border-slate-600 bg-slate-900"
              }`}
              onClick={() => void toggleExternalAi(!aiSettings.externalAiEnabled)}
              type="button"
            >
              <span
                className={`block size-4 rounded-full bg-slate-50 transition ${
                  aiSettings.externalAiEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <StatusRow
            label="Current core"
            value={
              aiSettings.localAiEnabled
                ? `local ${aiSettings.localModel}`
                : aiSettings.externalAiEnabled
                  ? "external preference"
                  : "rule based"
            }
          />
        </Panel>

        <Panel icon={<Download className="size-5" />} title="Local Data">
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <ActionButton label="Export backup" onClick={() => void exportLocalData()} />
            <ActionButton label="Import backup" onClick={() => importInputRef.current?.click()} />
          </div>
          <input
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void importLocalData(event.target.files?.[0])}
            ref={importInputRef}
            type="file"
          />
        </Panel>

        <Panel icon={<Database className="size-5" />} title="V2 Work Model">
          <StatusRow label="Model" value="shared tasks and commitments" />
          <StatusRow label="Used by" value="schedule, quests, habits, events" />
          <StatusRow label="Sync type" value="local rebuild only" />
          <div className="mt-4">
            <ActionButton label="Rebuild work model" onClick={() => void rebuildWorkModel()} />
          </div>
        </Panel>
      </div>
    </section>
  );
}

function Panel({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <article className="system-panel rounded-sm p-4">
      <div className="system-panel-content">
        <div className="mb-4 flex items-center gap-2 text-systemCyan">
          {icon}
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-slate-100">{title}</h2>
        </div>
        {children}
      </div>
    </article>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-systemBlue/10 py-2 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  const Icon = label.includes("Import")
    ? Upload
    : label.includes("Export")
      ? Download
      : label.includes("Rebuild")
        ? RefreshCcw
        : undefined;

  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-sm border border-systemBlue/30 bg-systemBlue/10 px-3 py-2 text-xs font-semibold text-systemCyan transition hover:border-systemBlue/60"
      onClick={onClick}
      type="button"
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {label}
    </button>
  );
}

function ReminderLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-sm border border-systemBlue/10 bg-black/20 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300">{text}</span>
    </div>
  );
}
