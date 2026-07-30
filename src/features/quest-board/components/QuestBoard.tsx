import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatDots } from "@/components/shared/StatDots";
import {
  finishQuest,
  loadQuestBoard,
  postponeQuest,
  startQuest,
  type QuestBoardOptionView,
  type QuestBoardSlotView
} from "@/features/quest-board/questService";
import type { LifeStat } from "@/components/shared/statVisuals";

export function QuestBoard() {
  const [slots, setSlots] = useState<QuestBoardSlotView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ option: QuestBoardOptionView; slotId: string }>();
  const [finishingAttemptId, setFinishingAttemptId] = useState<string>();
  const [finishActualMinutes, setFinishActualMinutes] = useState("");
  const [finishDifficulty, setFinishDifficulty] = useState<"too_easy" | "right" | "too_hard">("right");
  const [finishError, setFinishError] = useState("");
  const [finishProof, setFinishProof] = useState("");
  const [finishScore, setFinishScore] = useState("");
  const [finishSummary, setFinishSummary] = useState("");
  const [postponeSlotId, setPostponeSlotId] = useState<string>();
  const [postponeReason, setPostponeReason] = useState("");
  const [replacementType, setReplacementType] = useState<"ordinary" | "emergency" | "recovery">("ordinary");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setSlots(await loadQuestBoard());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function confirmStart() {
    if (!selected) return;
    setBusy(true);
    await startQuest(selected.slotId, selected.option.option.id);
    setSelected(undefined);
    await refresh();
    setBusy(false);
  }

  async function confirmFinish(outcome: "completed" | "incomplete") {
    if (!finishingAttemptId) return;
    setBusy(true);
    setFinishError("");
    try {
      const earned = await finishQuest(finishingAttemptId, outcome, {
        actualMinutes: finishActualMinutes ? Number(finishActualMinutes) : undefined,
        completionProof: finishProof,
        difficultyFeedback: finishDifficulty,
        resultScore: finishScore ? Number(finishScore) : undefined,
        resultSummary: finishSummary
      });
      setResult(
        outcome === "completed"
          ? `Quest complete: +${earned.xp} XP, +${earned.resetPoints} reset points.`
          : "Attempt recorded as incomplete. The quest remains available."
      );
      setFinishingAttemptId(undefined);
      resetFinishEvidence();
      await refresh();
    } catch (error) {
      setFinishError(error instanceof Error ? error.message : "The result could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  function beginFinish(view: QuestBoardSlotView) {
    if (!view.activeAttempt) return;
    const activeTemplate = view.options.find((option) => option.option.status === "selected")?.template;
    setFinishActualMinutes(String(activeTemplate?.estimatedMinutes ?? ""));
    setFinishError("");
    setFinishingAttemptId(view.activeAttempt.id);
  }

  function resetFinishEvidence() {
    setFinishActualMinutes("");
    setFinishDifficulty("right");
    setFinishError("");
    setFinishProof("");
    setFinishScore("");
    setFinishSummary("");
  }

  async function confirmPostpone() {
    if (!postponeSlotId) return;
    setBusy(true);
    try {
      const phase = await postponeQuest(postponeSlotId, postponeReason, replacementType);
      setResult(`Postponement recorded. Quest is now ${phase.toUpperCase()}.`);
      setPostponeSlotId(undefined);
      setPostponeReason("");
      setReplacementType("ordinary");
      await refresh();
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Postponement was blocked.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <div className="system-panel rounded-sm p-5">
        <div className="system-panel-content">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="system-label text-xs font-semibold">Quest Board</p>
              <h1 className="system-title mt-3 text-2xl font-black text-slate-50">Quest Board.</h1>
            </div>
            <span className="rounded-sm border border-systemGreen/30 bg-systemGreen/10 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-systemGreen">
              Local quest engine
            </span>
          </div>
        </div>
      </div>

      {result ? (
        <div className="flex items-center justify-between gap-3 border border-systemGreen/30 bg-systemGreen/10 px-4 py-3 text-[12px] text-green-100">
          <span>{result}</span>
          <button aria-label="Dismiss result" onClick={() => setResult("")} type="button">
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {loading ? <LoadingPanel /> : null}
      {!loading && !slots.length ? <EmptyQuestBoard /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {slots.map((view) => (
          <section className="system-panel rounded-sm p-4" key={view.slot.id}>
            <div className="system-panel-content">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="system-label text-[10px]">Detected free slot</p>
                  <h2 className="mt-1 text-lg font-black text-slate-50">
                    {view.slot.startTime} - {view.slot.endTime}
                  </h2>
                </div>
                <span className="border border-systemBlue/35 bg-systemBlue/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-systemCyan">
                  {view.slot.phase}
                </span>
              </div>

              {view.activeAttempt ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border border-systemGreen/30 bg-systemGreen/10 p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-systemGreen">Quest active</p>
                    <p className="mt-1 text-xs text-slate-300">Execution timer started locally.</p>
                  </div>
                  <Button onClick={() => beginFinish(view)}>
                    <CheckCircle2 className="mr-2 size-4" />
                    Finish
                  </Button>
                </div>
              ) : null}

              <div className="grid gap-3">
                {view.options.map((option) => (
                  <QuestOptionCard
                    disabled={Boolean(view.activeAttempt) || view.slot.status === "completed"}
                    key={option.option.id}
                    onStart={() => setSelected({ option, slotId: view.slot.id })}
                    option={option}
                  />
                ))}
              </div>

              {view.slot.status !== "completed" && !view.activeAttempt ? (
                <Button
                  className="mt-3 h-8 px-3 text-[10px]"
                  onClick={() => setPostponeSlotId(view.slot.id)}
                  variant="ghost"
                >
                  <RotateCcw className="mr-2 size-3.5" />
                  Skip / Postpone Slot
                </Button>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {selected ? (
        <Dialog onClose={() => !busy && setSelected(undefined)} title="Start quest?">
          <QuestDetail option={selected.option} />
          <div className="mt-5 flex justify-end gap-2">
            <Button disabled={busy} onClick={() => setSelected(undefined)} variant="ghost">
              No
            </Button>
            <Button disabled={busy} onClick={confirmStart}>
              <Play className="mr-2 size-4" />
              {busy ? "Starting..." : "Yes, Start"}
            </Button>
          </div>
        </Dialog>
      ) : null}

      {finishingAttemptId ? (
        <Dialog
          onClose={() => {
            if (!busy) {
              setFinishingAttemptId(undefined);
              resetFinishEvidence();
            }
          }}
          title="Finish quest"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              Actual minutes
              <input
                className="h-10 border border-systemBlue/25 bg-black/35 px-3 text-sm normal-case tracking-normal text-slate-100 outline-none focus:border-systemViolet/60"
                min="1"
                onChange={(event) => setFinishActualMinutes(event.target.value)}
                type="number"
                value={finishActualMinutes}
              />
            </label>
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              Felt difficulty
              <select
                className="h-10 border border-systemBlue/25 bg-black/35 px-3 text-sm normal-case tracking-normal text-slate-100"
                onChange={(event) => setFinishDifficulty(event.target.value as typeof finishDifficulty)}
                value={finishDifficulty}
              >
                <option value="too_easy">Too easy</option>
                <option value="right">Right level</option>
                <option value="too_hard">Too hard</option>
              </select>
            </label>
          </div>
          <label className="mt-3 grid gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Completion proof
            <textarea
              className="min-h-20 w-full border border-systemBlue/25 bg-black/35 p-3 text-sm normal-case tracking-normal text-slate-100 outline-none focus:border-systemViolet/60"
              onChange={(event) => setFinishProof(event.target.value)}
              placeholder="What proves completion? Score, saved file, output, count, or result."
              value={finishProof}
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr]">
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              Score %
              <input
                className="h-10 border border-systemBlue/25 bg-black/35 px-3 text-sm normal-case tracking-normal text-slate-100 outline-none focus:border-systemViolet/60"
                max="100"
                min="0"
                onChange={(event) => setFinishScore(event.target.value)}
                type="number"
                value={finishScore}
              />
            </label>
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              Result note
              <input
                className="h-10 border border-systemBlue/25 bg-black/35 px-3 text-sm normal-case tracking-normal text-slate-100 outline-none focus:border-systemViolet/60"
                onChange={(event) => setFinishSummary(event.target.value)}
                placeholder="Mistake, blocker, or useful observation"
                type="text"
                value={finishSummary}
              />
            </label>
          </div>
          {finishError ? <p className="mt-3 text-[11px] text-systemRed">{finishError}</p> : null}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button
              disabled={busy}
              onClick={() => {
                setFinishingAttemptId(undefined);
                resetFinishEvidence();
              }}
              variant="ghost"
            >
              Back
            </Button>
            <Button disabled={busy} onClick={() => confirmFinish("incomplete")} variant="secondary">
              Incomplete
            </Button>
            <Button disabled={busy} onClick={() => confirmFinish("completed")}>
              Completed
            </Button>
          </div>
        </Dialog>
      ) : null}

      {postponeSlotId ? (
        <Dialog onClose={() => !busy && setPostponeSlotId(undefined)} title="Postpone slot">
          <p className="text-[13px] leading-6 text-slate-300">
            A reason is optional in early phases but becomes mandatory when repeated postponement reaches Phase 3.
          </p>
          <textarea
            className="mt-4 min-h-24 w-full border border-systemBlue/25 bg-black/35 p-3 text-sm text-slate-100 outline-none focus:border-systemBlue/70"
            onChange={(event) => setPostponeReason(event.target.value)}
            placeholder="What prevented execution?"
            value={postponeReason}
          />
          <label className="mt-3 block">
            <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Replacement</span>
            <select
              className="mt-2 h-10 w-full border border-systemBlue/25 bg-black/35 px-3 text-sm text-slate-100"
              onChange={(event) =>
                setReplacementType(event.target.value as "ordinary" | "emergency" | "recovery")
              }
              value={replacementType}
            >
              <option value="ordinary">No replacement</option>
              <option value="recovery">Recovery option</option>
              <option value="emergency">Emergency option</option>
            </select>
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button disabled={busy} onClick={() => setPostponeSlotId(undefined)} variant="ghost">
              Cancel
            </Button>
            <Button disabled={busy} onClick={confirmPostpone} variant="secondary">
              Record Postponement
            </Button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}

function QuestOptionCard({
  disabled,
  onStart,
  option
}: {
  disabled: boolean;
  onStart: () => void;
  option: QuestBoardOptionView;
}) {
  const stats = Object.keys(option.template.statWeights) as LifeStat[];

  return (
    <article className="border border-systemBlue/20 bg-black/30 p-3 shadow-[inset_0_0_20px_rgba(233,91,255,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.16em] text-systemCyan">Option {option.option.rank}</p>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-100">{option.template.title}</p>
        </div>
        <span className="whitespace-nowrap text-xs font-semibold text-systemGreen">
          {option.template.baseXp} base XP
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{option.option.systemReason}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MetaChip>{option.template.category}</MetaChip>
        <MetaChip>{option.template.difficulty}</MetaChip>
        <MetaChip>{`${option.template.estimatedMinutes}m`}</MetaChip>
        {option.template.goalId || option.template.habitId ? <MetaChip tone="reset">RP+</MetaChip> : null}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Button className="h-8 px-3 text-[10px]" disabled={disabled} onClick={onStart} variant="secondary">
          <Play className="mr-2 size-3.5" />
          {disabled ? "Unavailable" : "Start"}
        </Button>
        <StatDots stats={stats} />
      </div>
    </article>
  );
}

function QuestDetail({ option }: { option: QuestBoardOptionView }) {
  return (
    <div className="space-y-3">
      <p className="text-base font-black uppercase tracking-[0.06em] text-slate-50">{option.template.title}</p>
      <p className="text-[12px] leading-5 text-slate-400">
        {option.template.description ?? option.option.systemReason}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <DetailMetric label="Base XP" value={String(option.template.baseXp)} />
        <DetailMetric label="Duration" value={`${option.template.estimatedMinutes}m`} />
        <DetailMetric label="Category" value={option.template.category} />
      </div>
      {option.template.instructions?.length ? (
        <div className="border border-systemBlue/15 bg-black/25 p-3">
          <p className="text-[9px] uppercase tracking-[0.14em] text-systemViolet">Execution</p>
          <ol className="mt-2 space-y-2 text-[11px] leading-5 text-slate-300">
            {option.template.instructions.map((instruction, index) => (
              <li key={instruction}>{index + 1}. {instruction}</li>
            ))}
          </ol>
        </div>
      ) : null}
      {option.template.resourceQuery ? (
        <div className="border border-systemBlue/15 bg-systemBlue/5 p-3">
          <p className="text-[9px] uppercase tracking-[0.14em] text-systemCyan">Resource query</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-200">{option.template.resourceQuery}</p>
        </div>
      ) : null}
      {option.template.completionEvidence ? (
        <div className="border border-systemGreen/20 bg-systemGreen/5 p-3">
          <p className="text-[9px] uppercase tracking-[0.14em] text-systemGreen">Completion proof</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-200">{option.template.completionEvidence}</p>
        </div>
      ) : null}
    </div>
  );
}

function Dialog({
  children,
  onClose,
  title
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="system-panel w-full max-w-lg rounded-sm p-5">
        <div className="system-panel-content">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="system-label text-xs">{title}</p>
            <button aria-label="Close dialog" onClick={onClose} type="button">
              <X className="size-4 text-slate-400" />
            </button>
          </div>
          <div className="system-divider mb-4" />
          {children}
        </div>
      </div>
    </div>
  );
}

function EmptyQuestBoard() {
  return (
    <div className="system-panel rounded-sm p-6 text-center">
      <div className="system-panel-content">
        <Clock3 className="mx-auto size-7 text-systemCyan" />
        <h2 className="mt-3 text-base font-black uppercase tracking-[0.08em] text-slate-50">
          No activated quests
        </h2>
        <Button asChild className="mt-4">
          <Link to="/awakening">Begin Awakening</Link>
        </Button>
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="system-panel rounded-sm p-6 text-center text-[12px] uppercase tracking-[0.14em] text-slate-500">
      Reading local protocol...
    </div>
  );
}

function MetaChip({ children, tone = "default" }: { children: string; tone?: "default" | "reset" }) {
  return (
    <span
      className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${
        tone === "reset"
          ? "border-systemGreen/30 bg-systemGreen/10 text-systemGreen"
          : "border-systemBlue/20 bg-systemBlue/5 text-slate-400"
      }`}
    >
      {children}
    </span>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-systemBlue/15 bg-black/25 p-2">
      <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[11px] font-semibold text-systemCyan">{value}</p>
    </div>
  );
}
