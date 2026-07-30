import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { activateAwakeningProtocol } from "@/features/awakening/awakeningService";
import {
  eventsSchema,
  goalsSchema,
  personalitySchema,
  realitySchema,
  scheduleSchema
} from "@/features/awakening/awakeningSchemas";
import type {
  AwakeningBlock,
  AwakeningCommitment,
  AwakeningDraft,
  AwakeningEvent,
  AwakeningGoal
} from "@/features/awakening/types";
import { createId } from "@/lib/ids";
import { createStarterIdentityOptions } from "@/system/identity/identityEngine";
import { useAwakeningStore } from "@/stores/awakeningStore";
import type { LifeDomain } from "@/types/enums";

const steps = [
  { label: "Reality", meta: "current state" },
  { label: "Schedule", meta: "fixed time" },
  { label: "Goals", meta: "direction" },
  { label: "Profile", meta: "behavior start" },
  { label: "Events", meta: "deadlines" },
  { label: "Identity", meta: "selection" },
  { label: "Protocol", meta: "activation" }
];

const domains: Array<{ label: string; value: LifeDomain }> = [
  { label: "Academics", value: "academics" },
  { label: "Fitness / Health", value: "fitness_health" },
  { label: "Finance", value: "finance" },
  { label: "Discipline / Routine", value: "discipline_routine" },
  { label: "Skills / Career", value: "skills_career" },
  { label: "Personality / Social confidence", value: "personality_social_confidence" }
];

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fixedBlockPresets: Array<Omit<AwakeningBlock, "draftId" | "dayOfWeek">> = [
  {
    blockType: "school",
    dayOfWeeks: [1, 2, 3, 4, 5],
    endTime: "14:30",
    startTime: "08:00",
    title: "School"
  },
  {
    blockType: "work",
    dayOfWeeks: [1, 2, 3, 4, 5],
    endTime: "17:00",
    startTime: "09:00",
    title: "Job"
  },
  {
    blockType: "coaching",
    dayOfWeeks: [2, 4, 6],
    endTime: "18:30",
    startTime: "17:00",
    title: "Training / coaching"
  },
  {
    blockType: "sleep",
    dayOfWeeks: [0, 1, 2, 3, 4, 5, 6],
    endTime: "06:30",
    startTime: "22:30",
    title: "Sleep"
  }
];
const commitmentPresets: Array<Omit<AwakeningCommitment, "draftId" | "dayOfWeek">> = [
  {
    commitmentType: "fixed",
    dayOfWeeks: [1, 2, 3, 4, 5],
    domain: "academics",
    endTime: "20:00",
    startTime: "18:00",
    title: "Study block"
  },
  {
    commitmentType: "flexible",
    dayOfWeeks: [1, 2, 3, 4, 5, 6],
    domain: "skills_career",
    endTime: "21:00",
    startTime: "19:00",
    title: "Skill block"
  },
  {
    commitmentType: "fixed",
    dayOfWeeks: [1, 3, 5],
    domain: "fitness_health",
    endTime: "18:30",
    startTime: "17:30",
    title: "Workout"
  },
  {
    commitmentType: "flexible",
    dayOfWeeks: [0],
    domain: "discipline_routine",
    endTime: "18:00",
    startTime: "17:00",
    title: "Weekly review"
  }
];
const fieldClass =
  "h-10 w-full rounded-sm border border-systemBlue/25 bg-black/35 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-systemBlue/70 focus:ring-1 focus:ring-systemBlue/30";
const textareaClass = `${fieldClass} h-auto min-h-28 py-3 leading-6`;

export function AwakeningShell() {
  const navigate = useNavigate();
  const { currentStep, draft, reset, setCurrentStep, updateDraft } = useAwakeningStore();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const hierarchyWarnings = useMemo(() => {
    const primaryMonths = Math.min(
      ...draft.goals.filter((goal) => goal.level === "primary").map((goal) => goal.timelineMonths)
    );
    return draft.goals.filter(
      (goal) => goal.level === "secondary" && goal.timelineMonths > primaryMonths
    );
  }, [draft.goals]);

  function generateIdentities(refined = false) {
    const priorityDomains = draft.goals.map((goal) => goal.domain);
    const options = createStarterIdentityOptions(priorityDomains, {
      confidence: draft.identityConfidence,
      desiredDirection: refined ? draft.desiredDirection : undefined
    });
    updateDraft({
      identityOptions: options,
      selectedIdentityName: undefined
    });
  }

  function validateStep() {
    const result =
      currentStep === 0
        ? realitySchema.safeParse(draft)
        : currentStep === 1
          ? scheduleSchema.safeParse(draft)
          : currentStep === 2
            ? goalsSchema.safeParse(draft)
            : currentStep === 3
              ? personalitySchema.safeParse(draft)
              : currentStep === 4
                ? eventsSchema.safeParse(draft)
              : { success: true as const };

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Complete the required fields.");
      return false;
    }

    if (currentStep === 5 && !draft.selectedIdentityName) {
      setError("Select one identity path before continuing.");
      return false;
    }

    setError("");
    return true;
  }

  async function handleNext() {
    if (!validateStep()) return;

    if (currentStep === 4) {
      generateIdentities(false);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      await activateAwakeningProtocol(draft);
      reset();
      await navigate({ to: "/dashboard" });
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "Activation failed.");
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-4">
      <header className="system-panel rounded-sm p-5">
        <div className="system-panel-content">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="system-label text-xs font-semibold">The Awakening</p>
              <h1 className="system-title mt-3 max-w-4xl text-2xl font-black leading-tight text-slate-50">
                Diagnose reality. Generate identity. Activate protocol.
              </h1>
            </div>
            <span className="rounded-sm border border-systemBlue/30 bg-systemBlue/10 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-systemCyan">
              Step {currentStep + 1} / {steps.length}
            </span>
          </div>
          <div className="system-divider my-4" />
          <StepRail currentStep={currentStep} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="system-panel hidden rounded-sm p-4 lg:block">
          <div className="system-panel-content">
            <p className="system-label text-[10px]">Diagnostic Stage</p>
            <h2 className="mt-3 text-lg font-black uppercase tracking-[0.08em] text-slate-50">
              {steps[currentStep].label}
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-slate-400">
              The System asks for evidence and constraints. Strictness is not selected here; it will be learned from behavior.
            </p>
            <div className="mt-5 space-y-2">
              {steps.map((step, index) => (
                <button
                  key={step.label}
                  className={`flex w-full items-center gap-3 border-l px-3 py-2 text-left transition ${
                    index === currentStep
                      ? "border-systemBlue bg-systemBlue/10 text-slate-100"
                      : index < currentStep
                        ? "border-systemGreen/60 text-slate-400"
                        : "border-systemBlue/15 text-slate-600"
                  }`}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  type="button"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center text-[10px]">
                    {index < currentStep ? <Check className="size-3.5 text-systemGreen" /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold">{step.label}</span>
                    <span className="mt-0.5 block text-[9px] uppercase tracking-[0.12em] text-slate-600">
                      {step.meta}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="system-panel rounded-sm p-4 md:p-5">
          <div className="system-panel-content">
            {currentStep === 0 ? <RealityStep draft={draft} updateDraft={updateDraft} /> : null}
            {currentStep === 1 ? <ScheduleStep draft={draft} updateDraft={updateDraft} /> : null}
            {currentStep === 2 ? (
              <GoalsStep
                draft={draft}
                hierarchyWarnings={hierarchyWarnings}
                updateDraft={updateDraft}
              />
            ) : null}
            {currentStep === 3 ? <ProfileStep draft={draft} updateDraft={updateDraft} /> : null}
            {currentStep === 4 ? <EventsStep draft={draft} updateDraft={updateDraft} /> : null}
            {currentStep === 5 ? (
              <IdentityStep draft={draft} onRefine={() => generateIdentities(true)} updateDraft={updateDraft} />
            ) : null}
            {currentStep === 6 ? <ProtocolStep draft={draft} /> : null}

            {error ? (
              <p className="mt-5 border-l-2 border-systemRed bg-systemRed/10 px-3 py-2 text-[12px] text-red-200">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-systemBlue/15 pt-4">
              <Button
                disabled={currentStep === 0 || saving}
                onClick={() => {
                  setError("");
                  setCurrentStep(Math.max(0, currentStep - 1));
                }}
                variant="ghost"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
              <Button disabled={saving} onClick={handleNext}>
                {currentStep === steps.length - 1 ? (saving ? "Activating..." : "Activate System") : "Continue"}
                {currentStep < steps.length - 1 ? <ArrowRight className="ml-2 size-4" /> : null}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}

function StepRail({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {steps.map((step, index) => (
        <div key={step.label} className="min-w-0">
          <div
            className={`h-px ${
              index <= currentStep
                ? "bg-systemBlue shadow-[0_0_8px_rgba(233,91,255,0.65)]"
                : "bg-systemBlue/15"
            }`}
          />
          <p
            className={`mt-2 truncate text-[9px] uppercase tracking-[0.1em] ${
              index === currentStep ? "text-systemCyan" : "text-slate-600"
            }`}
          >
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
}

type StepProps = {
  draft: AwakeningDraft;
  updateDraft: (update: Partial<AwakeningDraft>) => void;
};

function RealityStep({ draft, updateDraft }: StepProps) {
  return (
    <StepFrame
      description="Describe the present identity without performing for the System. This becomes the baseline for later behavioral evidence."
      title="Current Reality"
    >
      <Field label="System name">
        <input
          className={fieldClass}
          onChange={(event) => updateDraft({ displayName: event.target.value })}
          placeholder="Hunter"
          value={draft.displayName}
        />
      </Field>
      <Field label="Current state and recurring problems">
        <textarea
          className={textareaClass}
          onChange={(event) => updateDraft({ currentState: event.target.value })}
          placeholder="Where are you inconsistent, underperforming, avoiding action, or losing control of your time?"
          value={draft.currentState}
        />
      </Field>
      <InfoStrip text="This is not your permanent identity. It is the starting measurement." />
    </StepFrame>
  );
}

function ScheduleStep({ draft, updateDraft }: StepProps) {
  function updateBlock(draftId: string, update: Partial<AwakeningBlock>) {
    updateDraft({
      fixedBlocks: draft.fixedBlocks.map((block) => (block.draftId === draftId ? { ...block, ...update } : block))
    });
  }

  function updateCommitment(draftId: string, update: Partial<AwakeningCommitment>) {
    updateDraft({
      commitments: draft.commitments.map((item) => (item.draftId === draftId ? { ...item, ...update } : item))
    });
  }

  function addFixedBlock(block: Omit<AwakeningBlock, "draftId" | "dayOfWeek">) {
    updateDraft({
      fixedBlocks: [
        ...draft.fixedBlocks,
        {
          ...block,
          dayOfWeek: block.dayOfWeeks[0] ?? 1,
          draftId: createId()
        }
      ]
    });
  }

  function addCommitment(commitment: Omit<AwakeningCommitment, "draftId" | "dayOfWeek">) {
    updateDraft({
      commitments: [
        ...draft.commitments,
        {
          ...commitment,
          dayOfWeek: commitment.dayOfWeeks[0] ?? 1,
          draftId: createId()
        }
      ]
    });
  }

  return (
    <StepFrame
      description="Fixed blocks are externally locked. Commitments are intentional recurring time and may be fixed or flexible."
      title="Weekly Structure"
    >
      <PresetGrid
        label="Suggested fixed blocks"
        onSelect={(index) => addFixedBlock(fixedBlockPresets[index])}
        presets={fixedBlockPresets}
      />
      <CollectionHeader
        action={() =>
          addFixedBlock({
            blockType: "school",
            dayOfWeeks: [1, 2, 3, 4, 5],
            endTime: "14:30",
            startTime: "08:00",
            title: "School"
          })
        }
        label="Fixed blocks"
      />
      <div className="space-y-2">
        {draft.fixedBlocks.map((block) => (
          <ScheduleRow
            dayOfWeek={block.dayOfWeek}
            dayOfWeeks={block.dayOfWeeks}
            endTime={block.endTime}
            key={block.draftId}
            onChange={(update) => updateBlock(block.draftId, update)}
            onRemove={() =>
              updateDraft({ fixedBlocks: draft.fixedBlocks.filter((item) => item.draftId !== block.draftId) })
            }
            startTime={block.startTime}
            title={block.title}
          >
            <select
              className={fieldClass}
              onChange={(event) =>
                updateBlock(block.draftId, { blockType: event.target.value as AwakeningBlock["blockType"] })
              }
              value={block.blockType}
            >
              <option value="school">School</option>
              <option value="work">Work</option>
              <option value="sleep">Sleep</option>
              <option value="meal">Meal</option>
              <option value="commute">Commute</option>
              <option value="coaching">Coaching / training</option>
              <option value="other">Other</option>
            </select>
          </ScheduleRow>
        ))}
        {!draft.fixedBlocks.length ? <EmptyLine text="No fixed blocks added." /> : null}
      </div>

      <PresetGrid
        label="Suggested commitments"
        onSelect={(index) => addCommitment(commitmentPresets[index])}
        presets={commitmentPresets}
      />
      <CollectionHeader
        action={() =>
          addCommitment({
            commitmentType: "fixed",
            dayOfWeeks: [1, 2, 3, 4, 5],
            domain: "skills_career",
            endTime: "20:00",
            startTime: "18:00",
            title: "Study / skill block"
          })
        }
        label="Commitments"
      />
      <div className="space-y-2">
        {draft.commitments.map((commitment) => (
          <ScheduleRow
            dayOfWeek={commitment.dayOfWeek}
            dayOfWeeks={commitment.dayOfWeeks}
            endTime={commitment.endTime}
            key={commitment.draftId}
            onChange={(update) => updateCommitment(commitment.draftId, update)}
            onRemove={() =>
              updateDraft({
                commitments: draft.commitments.filter((item) => item.draftId !== commitment.draftId)
              })
            }
            startTime={commitment.startTime}
            title={commitment.title}
          >
            <select
              className={fieldClass}
              onChange={(event) =>
                updateCommitment(commitment.draftId, {
                  commitmentType: event.target.value as "fixed" | "flexible"
                })
              }
              value={commitment.commitmentType}
            >
              <option value="fixed">Fixed commitment</option>
              <option value="flexible">Flexible commitment</option>
            </select>
            <select
              className={`${fieldClass} mt-2`}
              onChange={(event) =>
                updateCommitment(commitment.draftId, { domain: event.target.value as LifeDomain })
              }
              value={commitment.domain ?? "discipline_routine"}
            >
              {domains.map((domain) => (
                <option key={domain.value} value={domain.value}>
                  {domain.label}
                </option>
              ))}
            </select>
          </ScheduleRow>
        ))}
        {!draft.commitments.length ? <EmptyLine text="No commitments added." /> : null}
      </div>
    </StepFrame>
  );
}

function GoalsStep({
  draft,
  hierarchyWarnings,
  updateDraft
}: StepProps & { hierarchyWarnings: AwakeningGoal[] }) {
  function updateGoal(draftId: string, update: Partial<AwakeningGoal>) {
    updateDraft({
      goals: draft.goals.map((goal) => (goal.draftId === draftId ? { ...goal, ...update } : goal))
    });
  }

  return (
    <StepFrame
      description="Primary goals define identity direction. Secondary goals remain valid, but timeline conflicts must be acknowledged."
      title="Goals and Hierarchy"
    >
      <div className="space-y-3">
        {draft.goals.map((goal) => (
          <article className="rounded-sm border border-systemBlue/20 bg-black/25 p-3" key={goal.draftId}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-systemCyan">
                {goal.level} goal
              </span>
              {draft.goals.length > 1 ? (
                <IconButton
                  label="Remove goal"
                  onClick={() => updateDraft({ goals: draft.goals.filter((item) => item.draftId !== goal.draftId) })}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className={fieldClass}
                onChange={(event) => updateGoal(goal.draftId, { title: event.target.value })}
                placeholder="Goal title"
                value={goal.title}
              />
              <select
                className={fieldClass}
                onChange={(event) => updateGoal(goal.draftId, { domain: event.target.value as LifeDomain })}
                value={goal.domain}
              >
                {domains.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
              <select
                className={fieldClass}
                onChange={(event) =>
                  updateGoal(goal.draftId, {
                    timelineMonths: Number(event.target.value) as AwakeningGoal["timelineMonths"]
                  })
                }
                value={goal.timelineMonths}
              >
                {[3, 6, 9, 12, 18].map((months) => (
                  <option key={months} value={months}>
                    {months} months
                  </option>
                ))}
              </select>
              <input
                className={fieldClass}
                onChange={(event) => updateGoal(goal.draftId, { reason: event.target.value })}
                placeholder="Why this matters"
                value={goal.reason}
              />
            </div>
            {hierarchyWarnings.some((warning) => warning.draftId === goal.draftId) ? (
              <div className="mt-3 border-l-2 border-amber-400 bg-amber-400/5 px-3 py-2">
                <p className="text-[11px] leading-5 text-amber-200">
                  This secondary goal lasts longer than the primary goal. Keep it, promote it, or later split it into sub-goals.
                </p>
                <Button
                  className="mt-2 h-7 px-2 text-[10px]"
                  onClick={() => updateGoal(goal.draftId, { level: "primary" })}
                  variant="secondary"
                >
                  Make Primary
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <Button
        onClick={() =>
          updateDraft({
            goals: [
              ...draft.goals,
              {
                domain: "discipline_routine",
                draftId: createId(),
                level: "secondary",
                reason: "",
                timelineMonths: 6,
                title: ""
              }
            ]
          })
        }
        variant="secondary"
      >
        <Plus className="mr-2 size-4" />
        Add Secondary Goal
      </Button>
    </StepFrame>
  );
}

function ProfileStep({ draft, updateDraft }: StepProps) {
  return (
    <StepFrame
      description="16Personalities-style language provides an accessible starting hypothesis. Trait sliders provide behavioral nuance and will later be corrected by real usage."
      title="Personality and Weak Areas"
    >
      <Field label="Known personality type (optional)">
        <input
          className={fieldClass}
          maxLength={8}
          onChange={(event) => updateDraft({ mbtiType: event.target.value.toUpperCase() })}
          placeholder="Example: INTJ"
          value={draft.mbtiType}
        />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <TraitSlider label="Openness" onChange={(openness) => updateDraft({ openness })} value={draft.openness} />
        <TraitSlider
          label="Conscientiousness"
          onChange={(conscientiousness) => updateDraft({ conscientiousness })}
          value={draft.conscientiousness}
        />
        <TraitSlider
          label="Extraversion"
          onChange={(extraversion) => updateDraft({ extraversion })}
          value={draft.extraversion}
        />
        <TraitSlider
          label="Agreeableness"
          onChange={(agreeableness) => updateDraft({ agreeableness })}
          value={draft.agreeableness}
        />
        <TraitSlider
          label="Stress sensitivity"
          onChange={(neuroticism) => updateDraft({ neuroticism })}
          value={draft.neuroticism}
        />
      </div>
      <Field label="Problem areas and target habits">
        <textarea
          className={textareaClass}
          onChange={(event) => updateDraft({ problemAreasText: event.target.value })}
          placeholder="Comma-separated: procrastination, social avoidance, irregular sleep, uncontrolled spending"
          value={draft.problemAreasText}
        />
      </Field>
    </StepFrame>
  );
}

function EventsStep({ draft, updateDraft }: StepProps) {
  function updateEvent(draftId: string, update: Partial<AwakeningEvent>) {
    updateDraft({
      events: draft.events.map((event) => (event.draftId === draftId ? { ...event, ...update } : event))
    });
  }

  const priorityDomains = [...new Set(draft.goals.map((goal) => goal.domain))];

  return (
    <StepFrame
      description="Events create backward preparation tasks. They are reviewed before entering the schedule."
      title="Deadlines and System Analysis"
    >
      <CollectionHeader
        action={() =>
          updateDraft({
            events: [
              ...draft.events,
              {
                draftId: createId(),
                eventDate: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
                eventType: "exam_test",
                importance: "high",
                title: ""
              }
            ]
          })
        }
        label="Events"
      />
      <div className="space-y-2">
        {draft.events.map((event) => (
          <div className="grid gap-2 rounded-sm border border-systemBlue/15 bg-black/25 p-3 md:grid-cols-4" key={event.draftId}>
            <input
              className={fieldClass}
              onChange={(changeEvent) => updateEvent(event.draftId, { title: changeEvent.target.value })}
              placeholder="Event title"
              value={event.title}
            />
            <select
              className={fieldClass}
              onChange={(changeEvent) =>
                updateEvent(event.draftId, { eventType: changeEvent.target.value as AwakeningEvent["eventType"] })
              }
              value={event.eventType}
            >
              <option value="exam_test">Exam / test</option>
              <option value="submission">Submission</option>
              <option value="interview">Interview</option>
              <option value="bill_due">Bill due</option>
              <option value="birthday_anniversary">Birthday / anniversary</option>
              <option value="user_defined">Other</option>
            </select>
            <input
              className={fieldClass}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(changeEvent) => updateEvent(event.draftId, { eventDate: changeEvent.target.value })}
              type="date"
              value={event.eventDate}
            />
            <div className="flex gap-2">
              <select
                className={fieldClass}
                onChange={(changeEvent) =>
                  updateEvent(event.draftId, { importance: changeEvent.target.value as AwakeningEvent["importance"] })
                }
                value={event.importance}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <IconButton
                label="Remove event"
                onClick={() => updateDraft({ events: draft.events.filter((item) => item.draftId !== event.draftId) })}
              >
                <Trash2 className="size-3.5" />
              </IconButton>
            </div>
          </div>
        ))}
        {!draft.events.length ? <EmptyLine text="No dated events. You can continue without one." /> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <AnalysisCard label="Priority domains" value={`${priorityDomains.length} detected`} />
        <AnalysisCard label="Known fixed items" value={`${draft.fixedBlocks.length + draft.commitments.length}`} />
        <AnalysisCard label="Early risks" value={`${draft.problemAreasText.split(",").filter((item) => item.trim()).length}`} />
      </div>
      <Field label="Identity confidence">
        <select
          className={fieldClass}
          onChange={(event) =>
            updateDraft({ identityConfidence: event.target.value as AwakeningDraft["identityConfidence"] })
          }
          value={draft.identityConfidence}
        >
          <option value="high">High confidence - show 2</option>
          <option value="medium">Medium confidence - show 3</option>
          <option value="low">Low confidence - show 3 distinct directions</option>
        </select>
      </Field>
    </StepFrame>
  );
}

function IdentityStep({
  draft,
  onRefine,
  updateDraft
}: StepProps & { onRefine: () => void }) {
  return (
    <StepFrame
      description="Choose the direction that best matches the primary goals. Desired direction can correct the System before final selection."
      title="Identity Options"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {draft.identityOptions.map((option) => {
          const selected = draft.selectedIdentityName === option.name;
          return (
            <button
              className={`min-h-56 border p-4 text-left transition ${
                selected
                  ? "border-systemBlue bg-systemBlue/15 shadow-[0_0_22px_rgba(233,91,255,0.22)]"
                  : "border-systemBlue/20 bg-black/25 hover:border-systemBlue/45"
              }`}
              key={option.name}
              onClick={() => updateDraft({ selectedIdentityName: option.name })}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.14em] text-systemCyan">
                  {option.intensity} intensity
                </span>
                {selected ? <Check className="size-4 text-systemGreen" /> : null}
              </div>
              <h3 className="mt-3 text-base font-black uppercase tracking-[0.06em] text-slate-50">
                {option.name}
              </h3>
              <p className="mt-3 text-[12px] leading-5 text-slate-400">{option.transformationPromise}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {option.pillars.map((pillar) => (
                  <span
                    className="border border-systemBlue/20 bg-black/25 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-slate-400"
                    key={pillar}
                  >
                    {pillar.split("_").join(" ")}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      <Field label="Desired direction or correction">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={fieldClass}
            onChange={(event) => updateDraft({ desiredDirection: event.target.value })}
            placeholder="Example: more socially confident, technically skilled, and dependable"
            value={draft.desiredDirection}
          />
          <Button disabled={!draft.desiredDirection.trim()} onClick={onRefine} variant="secondary">
            <RefreshCw className="mr-2 size-4" />
            Regenerate
          </Button>
        </div>
      </Field>
    </StepFrame>
  );
}

function ProtocolStep({ draft }: { draft: AwakeningDraft }) {
  const identity = draft.identityOptions.find((option) => option.name === draft.selectedIdentityName);

  return (
    <StepFrame
      description="Activation writes this protocol to the local Life OS database and generates the first Quest Board."
      title="Protocol Preview"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <ProtocolPanel label="Identity">
          <p className="text-lg font-black uppercase tracking-[0.06em] text-systemCyan">{identity?.name}</p>
          <p className="mt-2 text-[12px] leading-5 text-slate-400">{identity?.transformationPromise}</p>
        </ProtocolPanel>
        <ProtocolPanel label="Transformation basis">
          <p className="text-sm font-semibold text-slate-100">{draft.goals.length} active goals</p>
          <p className="mt-2 text-[12px] text-slate-400">
            {draft.problemAreasText.split(",").filter((item) => item.trim()).length} weak areas targeted
          </p>
        </ProtocolPanel>
        <ProtocolPanel label="Weekly structure">
          <p className="text-sm font-semibold text-slate-100">
            {draft.fixedBlocks.length} fixed blocks | {draft.commitments.length} commitments
          </p>
          <p className="mt-2 text-[12px] text-slate-400">Free blocks will be calculated locally from 06:00-23:00.</p>
        </ProtocolPanel>
        <ProtocolPanel label="Events">
          <p className="text-sm font-semibold text-slate-100">{draft.events.length} dated events</p>
          <p className="mt-2 text-[12px] text-slate-400">Backward preparation plans will be created as drafts.</p>
        </ProtocolPanel>
      </div>
      <div className="rounded-sm border border-systemGreen/25 bg-systemGreen/10 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-systemGreen" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-systemGreen">Local activation</p>
            <p className="mt-1 text-[12px] leading-5 text-slate-300">
              This protocol remains in IndexedDB on this device. External AI stays disabled.
            </p>
          </div>
        </div>
      </div>
    </StepFrame>
  );
}

function StepFrame({
  children,
  description,
  title
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="system-label text-[10px]">Awakening Input</p>
        <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em] text-slate-50">{title}</h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-400">{description}</p>
      </div>
      <div className="system-divider" />
      {children}
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function CollectionHeader({ action, label }: { action: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">{label}</p>
      <Button className="h-8 px-2.5 text-[10px]" onClick={action} variant="secondary">
        <Plus className="mr-1.5 size-3.5" />
        Add
      </Button>
    </div>
  );
}

function PresetGrid({
  label,
  onSelect,
  presets
}: {
  label: string;
  onSelect: (index: number) => void;
  presets: Array<{
    dayOfWeeks: number[];
    endTime: string;
    startTime: string;
    title: string;
  }>;
}) {
  return (
    <div className="rounded-sm border border-systemBlue/15 bg-black/20 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {presets.map((preset, index) => (
          <button
            className="rounded-sm border border-systemBlue/20 bg-black/25 px-3 py-2 text-left transition hover:border-systemBlue/50 hover:bg-systemBlue/10"
            key={`${preset.title}-${preset.startTime}-${preset.endTime}`}
            onClick={() => onSelect(index)}
            type="button"
          >
            <span className="block truncate text-xs font-semibold text-slate-100">{preset.title}</span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.1em] text-slate-500">
              {formatSelectedDays(preset.dayOfWeeks)} | {preset.startTime}-{preset.endTime}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScheduleRow({
  children,
  dayOfWeek,
  dayOfWeeks,
  endTime,
  onChange,
  onRemove,
  startTime,
  title
}: {
  children?: ReactNode;
  dayOfWeek: number;
  dayOfWeeks: number[];
  endTime: string;
  onChange: (update: Partial<AwakeningBlock & AwakeningCommitment>) => void;
  onRemove: () => void;
  startTime: string;
  title: string;
}) {
  return (
    <div className="grid gap-2 rounded-sm border border-systemBlue/15 bg-black/25 p-3 md:grid-cols-[1.4fr_1.4fr_0.8fr_0.8fr_auto]">
      <input
        className={fieldClass}
        onChange={(event) => onChange({ title: event.target.value })}
        placeholder="Title"
        value={title}
      />
      <DaySelector
        selectedDays={dayOfWeeks?.length ? dayOfWeeks : [dayOfWeek]}
        onChange={(nextDays) => onChange({ dayOfWeek: nextDays[0] ?? dayOfWeek, dayOfWeeks: nextDays })}
      />
      <input
        className={fieldClass}
        onChange={(event) => onChange({ startTime: event.target.value })}
        type="time"
        value={startTime}
      />
      <input
        className={fieldClass}
        onChange={(event) => onChange({ endTime: event.target.value })}
        type="time"
        value={endTime}
      />
      <IconButton label="Remove item" onClick={onRemove}>
        <Trash2 className="size-3.5" />
      </IconButton>
      {children ? <div className="md:col-span-5">{children}</div> : null}
    </div>
  );
}

function DaySelector({
  onChange,
  selectedDays
}: {
  onChange: (days: number[]) => void;
  selectedDays: number[];
}) {
  function toggleDay(day: number) {
    const exists = selectedDays.includes(day);
    const next = exists ? selectedDays.filter((item) => item !== day) : [...selectedDays, day].sort((a, b) => a - b);
    onChange(next.length ? next : selectedDays);
  }

  return (
    <details className="relative">
      <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-sm border border-systemBlue/25 bg-black/35 px-3 text-sm text-slate-100 outline-none transition hover:border-systemBlue/50">
        <span className="truncate">{formatSelectedDays(selectedDays)}</span>
        <span className="text-[10px] uppercase tracking-[0.12em] text-systemCyan">Days</span>
      </summary>
      <div className="absolute z-30 mt-2 grid w-[320px] max-w-[80vw] grid-cols-2 gap-1 rounded-sm border border-systemBlue/30 bg-abyss p-2 shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
        <DayQuickButton label="Weekdays" onClick={() => onChange([1, 2, 3, 4, 5])} />
        <DayQuickButton label="Everyday" onClick={() => onChange([0, 1, 2, 3, 4, 5, 6])} />
        {days.map((day, index) => {
          const selected = selectedDays.includes(index);
          return (
            <label
              className={`flex h-9 cursor-pointer items-center gap-2 rounded-sm border px-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                selected
                  ? "border-systemBlue/60 bg-systemBlue/20 text-systemCyan shadow-[0_0_12px_rgba(233,91,255,0.18)]"
                  : "border-systemBlue/15 bg-black/25 text-slate-500 hover:border-systemBlue/35"
              }`}
              key={day}
            >
              <input
                checked={selected}
                className="size-3 accent-[#e95bff]"
                onChange={() => toggleDay(index)}
                type="checkbox"
              />
              {day}
            </label>
          );
        })}
      </div>
    </details>
  );
}

function DayQuickButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="rounded-sm border border-systemBlue/20 bg-systemBlue/10 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-systemCyan"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      type="button"
    >
      {label}
    </button>
  );
}

function formatSelectedDays(selectedDays: number[]) {
  if (selectedDays.length === 7) return "Everyday";
  if ([1, 2, 3, 4, 5].every((day) => selectedDays.includes(day)) && selectedDays.length === 5) {
    return "Mon-Fri";
  }
  return selectedDays.map((day) => days[day]).join(", ");
}

function TraitSlider({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="rounded-sm border border-systemBlue/15 bg-black/25 p-3">
      <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-slate-400">
        {label}
        <span className="text-systemCyan">{value}</span>
      </span>
      <input
        className="mt-3 h-1 w-full accent-[#e95bff]"
        max={100}
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
    </label>
  );
}

function AnalysisCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-systemBlue/15 bg-black/25 p-3">
      <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-systemCyan">{value}</p>
    </div>
  );
}

function ProtocolPanel({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="min-h-28 rounded-sm border border-systemBlue/20 bg-black/25 p-4">
      <p className="mb-3 text-[9px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function InfoStrip({ text }: { text: string }) {
  return (
    <div className="border-l border-systemBlue bg-systemBlue/5 px-3 py-2 text-[12px] leading-5 text-slate-400">
      {text}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="rounded-sm border border-dashed border-systemBlue/15 px-3 py-5 text-center text-[12px] text-slate-600">
      {text}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-systemBlue/20 bg-black/25 text-slate-400 transition hover:border-systemBlue/50 hover:text-systemCyan"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
