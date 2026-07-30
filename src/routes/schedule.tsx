import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Lock, MoveHorizontal, RotateCcw, Timer } from "lucide-react";

import { StatDots } from "@/components/shared/StatDots";
import type { LifeStat } from "@/components/shared/statVisuals";
import {
  loadDisciplineStatus,
  runWeeklyReview
} from "@/features/schedule/disciplineService";
import { adaptWorkItemsToWindow, chooseAdaptationMode } from "@/system/scheduling/boundedScheduleAdapter";
import { loadUnifiedWorkItems } from "@/system/work/workItemEngine";
import type { WorkItem } from "@/types/domain";

type BlockKind = "fixed block" | "fixed commitment" | "flexible commitment" | "free slot" | "detected";
type BlockStatus = "history" | "active" | "upcoming" | "completed";

type ScheduleBlock = {
  end: number;
  group: string;
  kind: BlockKind;
  labels: string[];
  resetPoints?: number;
  segments?: Array<{
    duration: string;
    stats: LifeStat[];
    time: string;
    title: string;
  }>;
  start: number;
  stats: LifeStat[];
  title: string;
  locked?: boolean;
  completed?: boolean;
  adaptationReason?: string;
  adjustedMinutes?: number;
  plannedMinutes?: number;
};

type AdaptationNote = {
  adjustedMinutes: number;
  plannedMinutes: number;
  reason?: string;
  title: string;
};

const DAY_MINUTES = 24 * 60;

const scheduleBlocks: ScheduleBlock[] = [
  {
    end: 390,
    group: "sleep",
    kind: "detected",
    labels: ["screen inactive", "sleep cycle"],
    start: 0,
    stats: ["vitality", "perception"],
    title: "Sleep capture window"
  },
  {
    end: 870,
    group: "school",
    kind: "fixed block",
    labels: ["hard locked", "external"],
    locked: true,
    start: 480,
    stats: ["discipline"],
    title: "School"
  },
  {
    completed: true,
    end: 930,
    group: "recovery",
    kind: "flexible commitment",
    labels: ["food", "reset"],
    start: 885,
    stats: ["vitality"],
    title: "Lunch and decompression"
  },
  {
    end: 1035,
    group: "study",
    kind: "fixed commitment",
    labels: ["primary", "deadline prep"],
    resetPoints: 12,
    start: 975,
    stats: ["intelligence", "focus"],
    title: "Physics mock-test review"
  },
  {
    end: 1215,
    group: "routine",
    kind: "flexible commitment",
    labels: ["linked sequence", "system adjusted"],
    resetPoints: 21,
    segments: [
      { duration: "45m", stats: ["vitality", "discipline"], time: "17:15", title: "Exercise" },
      { duration: "15m", stats: ["vitality"], time: "18:00", title: "Bath" },
      { duration: "5m", stats: ["discipline", "perception"], time: "18:15", title: "Face wash" },
      { duration: "1h 55m", stats: ["intelligence", "focus"], time: "18:20", title: "Coding project" }
    ],
    start: 1035,
    stats: ["vitality", "discipline", "intelligence", "focus", "perception"],
    title: "Routine circuit"
  },
  {
    end: 1290,
    group: "free",
    kind: "free slot",
    labels: ["2 options", "adaptive"],
    start: 1230,
    stats: ["focus", "perception"],
    title: "Detected free slot"
  },
  {
    end: 1380,
    group: "reflection",
    kind: "flexible commitment",
    labels: ["journal", "planning"],
    resetPoints: 4,
    start: 1320,
    stats: ["perception", "discipline"],
    title: "System log and tomorrow plan"
  }
];

const groupSummary = [
  { label: "Fixed", value: "7h 30m", tone: "slate" },
  { label: "Important", value: "4 quests", tone: "blue" },
  { label: "Routine", value: "4 linked", tone: "violet" },
  { label: "Free", value: "1 slot", tone: "green" }
];

export function ScheduleRoute() {
  const now = getCurrentMinute();
  const [discipline, setDiscipline] = useState<Awaited<ReturnType<typeof loadDisciplineStatus>>>();
  const [reviewMessage, setReviewMessage] = useState("");
  const [workBlocks, setWorkBlocks] = useState<ScheduleBlock[]>([]);
  const [adaptationNotes, setAdaptationNotes] = useState<AdaptationNote[]>([]);
  const [adaptationWarnings, setAdaptationWarnings] = useState<string[]>([]);
  const [adaptationMode, setAdaptationMode] = useState("normal");
  const shownBlocks = workBlocks.length ? workBlocks : scheduleBlocks;

  useEffect(() => {
    void loadDisciplineStatus().then((status) => {
      setDiscipline(status);
      setAdaptationMode(
        chooseAdaptationMode({
          completionRate: status.completionRate,
          deadlinePressure: status.sundayPolicy.mode === "deadline_priority" ? 0.8 : 0.35,
          postponementRate: status.postponementRate
        })
      );
    });
    void loadUnifiedWorkItems().then((items) => {
      const result = workItemsToScheduleBlocks(items);
      setWorkBlocks(result.blocks);
      setAdaptationNotes(result.notes);
      setAdaptationWarnings(result.warnings);
    });
  }, []);

  return (
    <section className="mx-auto max-w-7xl space-y-4">
      <div className="system-panel rounded-sm p-5">
        <div className="system-panel-content">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="system-label text-xs font-semibold">Schedule</p>
              <h1 className="system-title mt-3 text-2xl font-black text-slate-50">Time-scale day structure.</h1>
            </div>
            <div className="flex items-center gap-2">
              <IconButton label="Previous day">
                <ChevronLeft className="size-4" />
              </IconButton>
              <span className="rounded-sm border border-systemBlue/30 bg-systemBlue/10 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-systemCyan">
                Today
              </span>
              <IconButton label="Next day">
                <ChevronRight className="size-4" />
              </IconButton>
            </div>
          </div>
          <div className="system-divider my-4" />
          <div className="grid gap-3 text-[13px] leading-6 text-slate-300 lg:grid-cols-[1fr_360px]">
            <div />
            <div className="grid grid-cols-3 gap-2 text-center">
              <MetaPill label="Day" active />
              <MetaPill label="Week" />
              <MetaPill label="Month" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="system-panel rounded-sm p-4">
          <div className="system-panel-content space-y-4">
            <div>
              <p className="system-label text-[11px]">Day Data</p>
              <h2 className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-slate-50">
                July 25
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Preview mode. Real data will come from fixed blocks, routine rules, screen activity, and task completion logs.
              </p>
            </div>

            {discipline ? (
              <div className="rounded-sm border border-systemBlue/20 bg-black/25 p-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Weekly discipline</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <span className="text-slate-400">Completion</span>
                  <span className="text-right text-systemCyan">{Math.round(discipline.completionRate * 100)}%</span>
                  <span className="text-slate-400">Personal time</span>
                  <span className="text-right text-systemCyan">{discipline.currentPersonalTimeHours}h</span>
                  <span className="text-slate-400">Sunday mode</span>
                  <span className="text-right text-systemCyan">
                    {discipline.sundayPolicy.mode.split("_").join(" ")}
                  </span>
                  <span className="text-slate-400">Reviews</span>
                  <span className="text-right text-systemCyan">{discipline.reviewsCompleted}/2</span>
                  <span className="text-slate-400">Next review</span>
                  <span className="text-right text-systemCyan">{discipline.nextReviewType.split("_").join(" ")}</span>
                  <span className="text-slate-400">Pressure</span>
                  <span className="text-right text-systemCyan">{discipline.unfinishedImportantCount} important</span>
                </div>
                <button
                  className="mt-3 w-full border border-systemBlue/30 bg-systemBlue/10 px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-systemCyan"
                  onClick={async () => {
                    try {
                      const result = await runWeeklyReview();
                      setReviewMessage(result.reason);
                      setDiscipline(await loadDisciplineStatus());
                    } catch (error) {
                      setReviewMessage(error instanceof Error ? error.message : "Weekly review could not be completed.");
                    }
                  }}
                  type="button"
                >
                  Run weekly review
                </button>
                {reviewMessage ? <p className="mt-2 text-[11px] leading-5 text-slate-400">{reviewMessage}</p> : null}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              {groupSummary.map((item) => (
                <div key={item.label} className="rounded-sm border border-systemBlue/15 bg-black/25 p-3">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className={`mt-1 text-sm font-semibold ${summaryToneClass(item.tone)}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-sm border border-systemGreen/25 bg-systemGreen/10 p-3">
              <div className="flex items-center gap-2 text-systemGreen">
                <RotateCcw className="size-4" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Reset Points</p>
              </div>
              <p className="mt-2 text-xl font-black text-slate-50">37 / 60</p>
              <p className="mt-1 text-xs text-slate-400">Important tasks only. Missed XP reduces RP in the same ratio.</p>
            </div>

            {discipline ? (
              <div className="rounded-sm border border-systemBlue/15 bg-black/25 p-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Recovery directive</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-systemCyan">
                  {discipline.recoveryDirective.intensity.split("_").join(" ")}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">{discipline.recoveryDirective.message}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  Recovery floor {discipline.recoveryDirective.recoveryMinutes}m
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <LegendItem label="History" className="border-slate-500/20 bg-slate-500/10" />
              <LegendItem label="Completed" className="border-systemGreen/40 bg-systemGreen/25 shadow-[0_0_12px_rgba(61,245,159,0.3)]" />
              <LegendItem label="Active" className="border-systemBlue/60 bg-systemBlue/20 shadow-[0_0_18px_rgba(233,91,255,0.4)]" />
              <LegendItem label="Upcoming" className="border-systemBlue/20 bg-black/30" />
            </div>

            <div className="rounded-sm border border-systemBlue/15 bg-black/25 p-3">
              <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Adaptation reasons</p>
              <div className="mt-3 space-y-2">
                {adaptationNotes.length ? (
                  adaptationNotes.slice(0, 4).map((note) => (
                    <div className="border-l border-systemBlue/35 pl-2" key={`${note.title}-${note.adjustedMinutes}`}>
                      <p className="truncate text-[11px] font-semibold text-slate-200">{note.title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {note.plannedMinutes}m to {note.adjustedMinutes}m
                      </p>
                      {note.reason ? <p className="mt-1 text-[10px] leading-4 text-systemCyan">{note.reason}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] leading-5 text-slate-500">No flexible item needed adjustment in this view.</p>
                )}
              </div>
              {adaptationWarnings.map((warning) => (
                <p className="mt-2 text-[10px] leading-4 text-warning" key={warning}>{warning}</p>
              ))}
            </div>
          </div>
        </aside>

        <section className="system-panel rounded-sm p-4">
          <div className="system-panel-content">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="system-label text-[11px]">Full Day Scale</p>
                <p className="mt-1 text-sm text-slate-400">
                  Fixed blocks are hard locked. Flexible commitments can shift only with a reason.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-sm border border-systemBlue/20 bg-black/25 px-3 py-2 text-xs text-slate-300">
                <Timer className="size-4 text-systemCyan" />
                <span>{formatMinute(now)} | {adaptationMode}</span>
              </div>
            </div>
            <Timeline blocks={shownBlocks} now={now} />
          </div>
        </section>
      </div>
    </section>
  );
}

function Timeline({ blocks, now }: { blocks: ScheduleBlock[]; now: number }) {
  return (
    <div className="relative overflow-hidden rounded-sm border border-systemBlue/15 bg-black/25">
      <NowMarker now={now} />
      <div className="grid min-h-[1440px] grid-cols-[56px_1fr]">
        <TimeRail />
        <div className="relative border-l border-systemBlue/15">
          <div className="absolute inset-0 schedule-grid opacity-70" />
          {blocks.map((block) => (
            <TimelineBlock key={`${block.start}-${block.title}`} block={block} status={getBlockStatus(block, now)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeRail() {
  const ticks = Array.from({ length: 9 }, (_, index) => index * 180);

  return (
    <div className="relative bg-black/30">
      {ticks.map((minute) => (
        <div
          key={minute}
          className="absolute left-0 flex w-full -translate-y-1/2 items-center justify-end border-t border-systemBlue/10 pr-2 text-[10px] uppercase tracking-[0.12em] text-slate-500"
          style={{ top: `${(minute / DAY_MINUTES) * 100}%` }}
        >
          {formatMinute(minute)}
        </div>
      ))}
    </div>
  );
}

function TimelineBlock({ block, status }: { block: ScheduleBlock; status: BlockStatus }) {
  const top = `${(block.start / DAY_MINUTES) * 100}%`;
  const height = `${((block.end - block.start) / DAY_MINUTES) * 100}%`;
  const isMicro = block.end - block.start <= 15;
  const isGrouped = Boolean(block.segments?.length);

  return (
    <article
      className={`absolute left-2 right-2 overflow-hidden rounded-sm border p-2 transition md:left-4 md:right-4 ${blockStatusClass(status)} ${
        isMicro ? "min-h-8" : "min-h-12"
      }`}
      style={{ top, height }}
    >
      <div className="flex h-full min-h-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-xs font-semibold text-slate-50 md:text-sm">{block.title}</p>
            {block.locked ? <Lock className="size-3 text-slate-400" /> : <MoveHorizontal className="size-3 text-systemCyan" />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <MetaChip>{`${formatMinute(block.start)}-${formatMinute(block.end)}`}</MetaChip>
            <MetaChip>{block.group}</MetaChip>
            <MetaChip>{block.kind}</MetaChip>
            {block.resetPoints ? <MetaChip tone="green">{`RP +${block.resetPoints}`}</MetaChip> : null}
          </div>
          {!isMicro && !isGrouped ? (
            <p className="mt-1 truncate text-[11px] text-slate-400">{block.labels.join(" / ")}</p>
          ) : null}
          {isGrouped ? (
            <div className="mt-2 grid grid-cols-2 gap-1">
              {block.segments?.map((segment) => (
                <div
                  key={`${segment.time}-${segment.title}`}
                  className="flex min-w-0 items-center justify-between gap-2 border-l border-systemBlue/35 bg-black/20 px-2 py-1"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold leading-tight text-slate-100">{segment.title}</p>
                    <p className="text-[9px] text-slate-500">
                      {segment.time} | {segment.duration}
                    </p>
                  </div>
                  <StatDots stats={segment.stats} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {isGrouped ? null : <StatDots stats={block.stats} />}
      </div>
    </article>
  );
}

function NowMarker({ now }: { now: number }) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex -translate-y-1/2 items-center gap-2"
      style={{ top: `${(now / DAY_MINUTES) * 100}%` }}
    >
      <span className="ml-1 size-2.5 rounded-full bg-systemBlue shadow-[0_0_14px_rgba(233,91,255,0.8)]" />
      <span className="h-px flex-1 bg-gradient-to-r from-systemBlue via-systemViolet to-transparent" />
    </div>
  );
}

function IconButton({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-sm border border-systemBlue/20 bg-black/25 text-slate-300 shadow-[0_0_12px_rgba(233,91,255,0.12)] transition hover:border-systemBlue/50 hover:text-systemCyan"
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function MetaPill({ active = false, label }: { active?: boolean; label: string }) {
  return (
    <button
      className={`rounded-sm border px-3 py-2 text-[11px] uppercase tracking-[0.12em] ${
        active
          ? "border-systemBlue/50 bg-systemBlue/15 text-systemCyan shadow-[0_0_14px_rgba(233,91,255,0.18)]"
          : "border-systemBlue/15 bg-black/25 text-slate-500"
      }`}
      type="button"
    >
      {label}
    </button>
  );
}

function MetaChip({ children, tone = "default" }: { children: string; tone?: "default" | "green" }) {
  const className =
    tone === "green"
      ? "border-systemGreen/30 bg-systemGreen/10 text-systemGreen"
      : "border-systemBlue/20 bg-systemBlue/5 text-slate-400";

  return <span className={`rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] ${className}`}>{children}</span>;
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className={`size-3 rounded-sm border ${className}`} />
      <span>{label}</span>
    </div>
  );
}

function getBlockStatus(block: ScheduleBlock, now: number): BlockStatus {
  if (block.completed) {
    return "completed";
  }

  if (block.end <= now) {
    return "history";
  }

  if (block.start <= now && block.end > now) {
    return "active";
  }

  return "upcoming";
}

function blockStatusClass(status: BlockStatus) {
  const classes = {
    active: "z-10 border-systemBlue/60 bg-systemBlue/20 shadow-[0_0_22px_rgba(233,91,255,0.28)]",
    completed: "z-10 border-systemGreen/45 bg-systemGreen/20 shadow-[0_0_18px_rgba(61,245,159,0.24)]",
    history: "border-slate-500/20 bg-slate-500/10 text-slate-400 opacity-80",
    upcoming: "border-systemBlue/20 bg-black/40"
  };

  return classes[status];
}

function formatMinute(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getCurrentMinute() {
  const date = new Date();

  return date.getHours() * 60 + date.getMinutes();
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function summaryToneClass(tone: string) {
  const classes: Record<string, string> = {
    blue: "text-systemCyan",
    green: "text-systemGreen",
    slate: "text-slate-200",
    violet: "text-systemBlue"
  };

  return classes[tone] ?? classes.slate;
}

function workItemsToScheduleBlocks(items: WorkItem[]): {
  blocks: ScheduleBlock[];
  notes: AdaptationNote[];
  warnings: string[];
} {
  const today = new Date().toISOString().slice(0, 10);
  const todayDayOfWeek = new Date().getDay();
  const timed = items.filter(
    (item) =>
      item.startTime &&
      item.endTime &&
      (item.date === today || item.dayOfWeek === todayDayOfWeek) &&
      item.status !== "expired"
  );

  if (!timed.length) return { blocks: [], notes: [], warnings: [] };

  const adaptation = adaptWorkItemsToWindow(
    timed,
    Math.max(0, 23 * 60 - 6 * 60),
    chooseAdaptationMode({
      completionRate: 0.65,
      deadlinePressure: timed.some((item) => item.priority === "critical" || item.kind === "deadline_prep") ? 0.8 : 0.35,
      postponementRate: 0.15
    })
  );

  const blocks = adaptation.items
    .filter((item) => item.startTime && item.endTime)
    .map((item) => ({
      adaptationReason: item.adaptationReason,
      adjustedMinutes: item.adjustedMinutes,
      completed: item.status === "completed",
      end: toMinutes(item.endTime!),
      group: item.kind.split("_").join(" "),
      kind: workKindToBlockKind(item),
      labels: [
        item.priority,
        item.flexibility,
        item.adaptationReason ? `${item.adjustedMinutes}m adjusted` : `${item.plannedMinutes}m planned`
      ],
      locked: item.flexibility === "locked",
      plannedMinutes: item.plannedMinutes,
      resetPoints: item.resetEligible ? item.resetPointValue : undefined,
      start: toMinutes(item.startTime!),
      stats: Object.keys(item.statWeights) as LifeStat[],
      title: item.title
    }))
    .filter((block) => block.end > block.start)
    .sort((a, b) => a.start - b.start || a.title.localeCompare(b.title));

  const notes = adaptation.items
    .filter((item) => item.adjustedMinutes !== item.plannedMinutes || item.adaptationReason)
    .map((item) => ({
      adjustedMinutes: item.adjustedMinutes,
      plannedMinutes: item.plannedMinutes,
      reason: item.adaptationReason,
      title: item.title
    }));

  return { blocks, notes, warnings: adaptation.warnings };
}

function workKindToBlockKind(item: WorkItem): BlockKind {
  if (item.kind === "fixed_block") return "fixed block";
  if (item.kind === "fixed_commitment") return "fixed commitment";
  if (item.kind === "flexible_commitment" || item.kind === "routine" || item.kind === "recovery") {
    return "flexible commitment";
  }
  if (item.kind === "quest" || item.kind === "deadline_prep") return "free slot";
  return "detected";
}
