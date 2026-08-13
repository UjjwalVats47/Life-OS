import { getBaseXp } from "@/system/gamification/xpEngine";
import { createTaskEvidenceFields } from "@/system/tasks/taskEvidenceEngine";
import type {
  Goal,
  GoalActionFeedbackReason,
  GoalActionPlan,
  GoalCapability,
  TaskAttempt,
  TaskTemplate
} from "@/types/domain";
import type { LifeDomain, StatName } from "@/types/enums";

export type GoalTaskHistorySignal = {
  actualMinutes?: number;
  actionType?: TaskTemplate["actionType"];
  difficultyFeedback?: "too_easy" | "right" | "too_hard";
  plannedMinutes?: number;
  resultScore?: number;
  status: "completed" | "postponed" | "skipped" | "incomplete";
  taskKey?: string;
  evidenceValues?: TaskAttempt["evidenceValues"];
};

export type GoalTaskFeedbackSignal = {
  actionType?: TaskTemplate["actionType"];
  feedbackType: "rejected" | "edited";
  reasonCode?: GoalActionFeedbackReason;
  reasonText?: string;
  revisedCompletionEvidence?: string;
  revisedEstimatedMinutes?: number;
  revisedInstructions?: string[];
  revisedTitle?: string;
  taskKey: string;
};

export type GoalTaskIntelligenceInput = {
  feedback?: GoalTaskFeedbackSignal[];
  goal: Goal;
  history?: GoalTaskHistorySignal[];
  planVersion?: number;
};

export type GoalActionPlanDraft = Omit<GoalActionPlan, "createdAt" | "id" | "updatedAt" | "userId">;

export type GeneratedTaskDraft = Omit<
  TaskTemplate,
  "createdAt" | "goalPlanId" | "id" | "updatedAt" | "userId"
>;

export type GoalTaskIntelligenceResult = {
  plan: GoalActionPlanDraft;
  tasks: GeneratedTaskDraft[];
};

type GoalArchetype = GoalActionPlan["archetype"];

type RecipeTask = {
  actionType: NonNullable<TaskTemplate["actionType"]>;
  capabilityKey: string;
  completionEvidence: string;
  dependencyTaskKeys?: string[];
  description: string;
  difficulty: TaskTemplate["difficulty"];
  estimatedMinutes: number;
  generationSource?: TaskTemplate["generationSource"];
  instructions: string[];
  resourceQuery?: string;
  taskKey: string;
  title: string;
};

type ArchetypeRecipe = {
  assumptions: string[];
  capabilities: GoalCapability[];
  interpretation: (subject: string) => string;
  successSignals: (subject: string) => string[];
  tasks: (subject: string) => RecipeTask[];
};

export function generateGoalTaskIntelligence(input: GoalTaskIntelligenceInput): GoalTaskIntelligenceResult {
  const archetype = inferGoalArchetype(input.goal);
  const subject = extractGoalSubject(input.goal.title, archetype);
  const recipe = recipes[archetype];
  const history = input.history ?? [];
  const feedback = input.feedback ?? [];
  const planVersion = input.planVersion ?? 1;
  const frictionCount = history.filter(
    (item) =>
      item.status === "postponed" ||
      item.status === "skipped" ||
      item.status === "incomplete" ||
      item.difficultyFeedback === "too_hard" ||
      (item.resultScore !== undefined && item.resultScore < 50)
  ).length;
  const completedTaskKeys = new Set(
    history.filter((item) => item.status === "completed").map((item) => item.taskKey).filter(Boolean)
  );
  const baseRecipeTasks = recipe.tasks(subject);
  const advancingCycle = baseRecipeTasks.length > 0 && baseRecipeTasks.every((task) => completedTaskKeys.has(task.taskKey));
  const cycleTasks = advancingCycle
    ? baseRecipeTasks.map((task) => nextCycleTask(task, planVersion))
    : baseRecipeTasks;
  const recipeTasks = applyUserFeedback(cycleTasks, feedback);

  const tasks = recipeTasks
    .filter((task) => !completedTaskKeys.has(task.taskKey))
    .map<GeneratedTaskDraft>((task, index) => {
      const adjusted = adaptForEvidence(
        adaptForObservedFriction(calibrateTask(task, input.goal), frictionCount),
        history
      );
      const category = input.goal.level === "primary" ? "critical" : "negotiable";
      return {
        ...adjusted,
        baseXp: getBaseXp(category),
        category,
        domain: input.goal.domain,
        evidenceFields: createTaskEvidenceFields(adjusted.actionType, input.goal.domain),
        generationSource: adjusted.generationSource ?? "deterministic",
        goalId: input.goal.id,
        sequenceIndex: index + 1,
        specificityScore: scoreGeneratedTaskSpecificity(adjusted),
        statWeights: statWeightsForDomain(input.goal.domain),
        status: "active"
      };
    });

  return {
    plan: {
      archetype,
      assumptions: [
        ...calibrationAssumptions(input.goal, recipe.assumptions),
        ...frictionAssumptions(frictionCount),
        ...performanceAssumptions(history),
        ...measuredEvidenceAssumptions(history),
        ...feedbackAssumptions(feedback)
      ],
      capabilities: recipe.capabilities,
      goalId: input.goal.id,
      interpretation: `${recipe.interpretation(subject)}${input.goal.targetOutcome ? ` Target proof: ${input.goal.targetOutcome}` : ""}`,
      status: "active",
      successSignals: [
        ...recipe.successSignals(subject),
        ...(input.goal.targetOutcome ? [`Declared target: ${input.goal.targetOutcome}`] : [])
      ],
      version: planVersion
    },
    tasks
  };
}

function applyUserFeedback(tasks: RecipeTask[], feedback: GoalTaskFeedbackSignal[]) {
  const latestByTask = new Map<string, GoalTaskFeedbackSignal>();
  feedback.forEach((item) => latestByTask.set(canonicalTaskKey(item.taskKey), item));

  const adapted = tasks.flatMap((task) => {
    const signal = latestByTask.get(canonicalTaskKey(task.taskKey));
    if (!signal) return [task];

    if (signal.feedbackType === "edited") {
      return [{
        ...task,
        completionEvidence: signal.revisedCompletionEvidence?.trim() || task.completionEvidence,
        estimatedMinutes: clampDuration(signal.revisedEstimatedMinutes ?? task.estimatedMinutes),
        generationSource: "user_edit" as const,
        instructions: signal.revisedInstructions?.filter((item) => item.trim()).map((item) => item.trim()) || task.instructions,
        title: signal.revisedTitle?.trim() || task.title
      }];
    }

    if (signal.reasonCode === "not_relevant" || signal.reasonCode === "other") return [];
    if (signal.reasonCode === "too_long") {
      return [{
        ...task,
        completionEvidence: `${task.completionEvidence} Minimum acceptable proof: finish the first defined unit.`,
        description: `${task.description} User feedback requires a shorter execution unit.`,
        estimatedMinutes: clampDuration(Math.round(task.estimatedMinutes * 0.6 / 5) * 5),
        generationSource: "user_feedback" as const,
        instructions: [...task.instructions, "Stop after the minimum proof; the remaining work belongs in a later action."]
      }];
    }
    if (signal.reasonCode === "too_difficult") {
      return [{
        ...task,
        description: `${task.description} User feedback requires a scaffolded version.`,
        difficulty: decreaseDifficulty(task.difficulty),
        generationSource: "user_feedback" as const,
        instructions: [...task.instructions, "Begin with one worked example, then complete one equivalent unit independently."]
      }];
    }
    if (signal.reasonCode === "too_easy") {
      return [{
        ...task,
        description: `${task.description} User feedback permits a harder version.`,
        difficulty: increaseDifficulty(task.difficulty),
        generationSource: "user_feedback" as const,
        instructions: [...task.instructions, "Increase the difficulty or independence while keeping the same completion proof."]
      }];
    }
    if (signal.reasonCode === "resource_unavailable") {
      return [{
        ...task,
        description: `${task.description} The previously suggested resource is unavailable.`,
        generationSource: "user_feedback" as const,
        instructions: [...task.instructions, "Use only a resource already declared by the user or choose a free equivalent."],
        resourceQuery: undefined
      }];
    }
    if (signal.reasonCode === "unclear") {
      return [{
        ...task,
        description: `${task.description} The action has been clarified after user feedback.`,
        generationSource: "user_feedback" as const,
        instructions: ["Before starting, state the exact item or resource you will use.", ...task.instructions]
      }];
    }
    return [task];
  });

  const survivingKeys = new Set(adapted.map((task) => task.taskKey));
  return adapted.map((task) => ({
    ...task,
    dependencyTaskKeys: task.dependencyTaskKeys?.filter((dependency) => survivingKeys.has(dependency))
  }));
}

function feedbackAssumptions(feedback: GoalTaskFeedbackSignal[]) {
  const latestByTask = new Map<string, GoalTaskFeedbackSignal>();
  feedback.forEach((item) => latestByTask.set(canonicalTaskKey(item.taskKey), item));
  const active = [...latestByTask.values()];
  const assumptions: string[] = [];
  if (active.some((item) => item.feedbackType === "edited")) {
    assumptions.push("User-edited action definitions are preserved across generation cycles.");
  }
  if (active.some((item) => item.feedbackType === "rejected")) {
    assumptions.push("Rejected System actions are adapted or suppressed without counting as execution failure.");
  }
  return assumptions;
}

function canonicalTaskKey(taskKey: string) {
  return taskKey.replace(/-cycle-\d+$/, "");
}

function clampDuration(minutes: number) {
  return Math.max(5, Math.min(180, Math.round(minutes)));
}

function adaptForEvidence(task: RecipeTask, history: GoalTaskHistorySignal[]): RecipeTask {
  const relevant = history.filter(
    (signal) => !signal.actionType || signal.actionType === task.actionType
  );
  const strongCount = relevant.filter(
    (signal) =>
      signal.status === "completed" &&
      (signal.difficultyFeedback === "too_easy" || (signal.resultScore ?? 0) >= 85)
  ).length;
  const struggleCount = relevant.filter(
    (signal) => signal.difficultyFeedback === "too_hard" || (signal.resultScore !== undefined && signal.resultScore < 50)
  ).length;

  if (strongCount >= 2 && task.actionType !== "resource_setup" && task.actionType !== "review_mistakes") {
    return {
      ...task,
      description: `${task.description} Prior evidence supports increasing the challenge one level.`,
      difficulty: increaseDifficulty(task.difficulty),
      instructions: [...task.instructions, "Use a harder question set, stricter condition, or more independent execution than the previous cycle."]
    };
  }

  if (struggleCount >= 2 && task.actionType !== "resource_setup") {
    return {
      ...task,
      description: `${task.description} Prior evidence requires a scaffolded attempt before increasing difficulty.`,
      difficulty: decreaseDifficulty(task.difficulty),
      instructions: [...task.instructions, "Use one worked example or a smaller first unit, then attempt the remaining proof independently."]
    };
  }

  return task;
}

function performanceAssumptions(history: GoalTaskHistorySignal[]) {
  const highScores = history.filter((item) => (item.resultScore ?? 0) >= 85).length;
  const lowScores = history.filter((item) => item.resultScore !== undefined && item.resultScore < 50).length;
  if (highScores >= 2) return ["Repeated high-quality evidence permits a harder next cycle."];
  if (lowScores >= 2) return ["Repeated low result scores require scaffolding before difficulty increases."];
  return [];
}

function measuredEvidenceAssumptions(history: GoalTaskHistorySignal[]) {
  const measured = history.filter(
    (item) => item.status === "completed" && Object.keys(item.evidenceValues ?? {}).length > 0
  );
  return measured.length
    ? [`${measured.length} completed actions include structured result evidence for later-cycle calibration.`]
    : [];
}

function increaseDifficulty(difficulty: RecipeTask["difficulty"]): RecipeTask["difficulty"] {
  const order: RecipeTask["difficulty"][] = ["easy", "normal", "hard", "very_hard"];
  return order[Math.min(order.length - 1, order.indexOf(difficulty) + 1)];
}

function decreaseDifficulty(difficulty: RecipeTask["difficulty"]): RecipeTask["difficulty"] {
  const order: RecipeTask["difficulty"][] = ["easy", "normal", "hard", "very_hard"];
  return order[Math.max(0, order.indexOf(difficulty) - 1)];
}

function calibrateTask(task: RecipeTask, goal: Goal): RecipeTask {
  const resourceInstruction = goal.availableResources
    ? `Use the declared resources when relevant: ${goal.availableResources}`
    : undefined;
  const constraintInstruction = goal.constraints
    ? `Respect these declared constraints: ${goal.constraints}`
    : undefined;
  return {
    ...task,
    description: `${task.description}${goal.currentLevel ? ` Current level: ${goal.currentLevel}.` : ""}${goal.targetOutcome ? ` Target: ${goal.targetOutcome}.` : ""}`,
    instructions: [...task.instructions, resourceInstruction, constraintInstruction].filter(
      (instruction): instruction is string => Boolean(instruction)
    ),
    resourceQuery: task.resourceQuery
      ? `${task.resourceQuery}${goal.currentLevel ? ` ${goal.currentLevel}` : ""}`
      : task.resourceQuery
  };
}

function calibrationAssumptions(goal: Goal, defaults: string[]) {
  const assumptions = goal.currentLevel
    ? [`Current level declared by user: ${goal.currentLevel}.`]
    : defaults;
  if (goal.availableResources) assumptions.push(`Available resources declared: ${goal.availableResources}.`);
  if (goal.constraints) assumptions.push(`Constraints declared: ${goal.constraints}.`);
  return assumptions;
}

function nextCycleTask(task: RecipeTask, version: number): RecipeTask {
  const suffix = `-cycle-${version}`;
  return {
    ...task,
    dependencyTaskKeys: task.dependencyTaskKeys?.map((dependency) => `${dependency}${suffix}`),
    taskKey: `${task.taskKey}${suffix}`,
    title: `Next cycle: ${task.title}`
  };
}

export function validateGeneratedTask(task: GeneratedTaskDraft) {
  const issues: string[] = [];
  if (task.title.trim().length < 12) issues.push("title is too short");
  if (/^(advance|improve|work on|practice|focus on)[: ]/i.test(task.title.trim())) {
    issues.push("title describes an intention instead of an executable action");
  }
  if (!task.completionEvidence?.trim()) issues.push("completion evidence is missing");
  if (!task.instructions?.length) issues.push("execution instructions are missing");
  if (!task.evidenceFields?.length) issues.push("structured evidence fields are missing");
  if (task.estimatedMinutes < 5 || task.estimatedMinutes > 180) issues.push("duration is outside the schedulable range");
  if ((task.specificityScore ?? 0) < 60) issues.push("specificity is below the required threshold");
  return { issues, valid: issues.length === 0 };
}

export function isGeneratedTaskEligible(task: TaskTemplate, completedTaskKeys: Set<string>) {
  return (task.dependencyTaskKeys ?? []).every((dependency) => completedTaskKeys.has(dependency));
}

export function inferGoalArchetype(goal: Pick<Goal, "domain" | "title" | "description" | "reason">): GoalArchetype {
  const title = goal.title.toLowerCase();
  const titleMatch = inferArchetypeFromText(title);
  if (titleMatch) return titleMatch;
  const text = `${goal.description ?? ""} ${goal.reason}`.toLowerCase();
  const contextMatch = inferArchetypeFromText(text);
  if (contextMatch) return contextMatch;
  return goal.domain === "academics" ? "academic_exam" : goal.domain === "fitness_health" ? "fitness" : "generic_skill";
}

function inferArchetypeFromText(text: string): GoalArchetype | undefined {
  if (/\b(exam|test|grade|academic|study|school|college|math|physics|chemistry|biology)\b/.test(text)) return "academic_exam";
  if (/\b(code|coding|program|programming|software|developer|javascript|typescript|python|java|web|app)\b/.test(text)) return "coding";
  if (/\b(job|career|interview|resume|cv|internship|placement|promotion)\b/.test(text)) return "career";
  if (/\b(fit|fitness|gym|run|running|weight|strength|health|exercise|sport)\b/.test(text)) return "fitness";
  if (/\b(social|confidence|speaking|communication|conversation|networking|friends)\b/.test(text)) return "social_confidence";
  if (/\b(finance|money|saving|save|budget|invest|expense|debt)\b/.test(text)) return "finance";
  if (/\b(discipline|routine|procrastination|focus|sleep|consistent|consistency)\b/.test(text)) return "discipline";
  return undefined;
}

function adaptForObservedFriction(task: RecipeTask, frictionCount: number): RecipeTask {
  if (frictionCount < 2 || task.estimatedMinutes <= 20) return task;
  const estimatedMinutes = Math.max(15, Math.round(task.estimatedMinutes * 0.7 / 5) * 5);
  return {
    ...task,
    completionEvidence: `${task.completionEvidence} Minimum acceptable proof: complete the first clearly defined unit.`,
    description: `${task.description} The duration is reduced because recent execution shows friction.`,
    estimatedMinutes,
    instructions: [...task.instructions, "Stop after the minimum proof if continuing would damage the rest of the schedule."]
  };
}

function frictionAssumptions(frictionCount: number) {
  return frictionCount >= 2
    ? ["Recent execution friction requires smaller initial actions until completion becomes reliable."]
    : [];
}

export function scoreGeneratedTaskSpecificity(
  task: Pick<GeneratedTaskDraft, "completionEvidence" | "description" | "estimatedMinutes" | "instructions" | "resourceQuery" | "title">
) {
  let score = 30;
  if (task.completionEvidence) score += 20;
  if ((task.instructions?.length ?? 0) >= 2) score += 20;
  if (task.estimatedMinutes >= 5) score += 10;
  if (task.resourceQuery) score += 10;
  if (/\b(one|two|three|four|five|1|2|3|4|5|10|15|20|30|45|60)\b/i.test(`${task.title} ${task.description}`)) score += 10;
  return Math.min(100, score);
}

function extractGoalSubject(title: string, archetype: GoalArchetype) {
  const cleaned = title
    .replace(/^(build|become|develop|improve|learn|master|get good at|be good at|create)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length >= 4) return cleaned;
  const fallbacks: Record<GoalArchetype, string> = {
    academic_exam: "the target subject",
    career: "the target career",
    coding: "coding",
    discipline: "the target routine",
    finance: "personal finance",
    fitness: "the target fitness outcome",
    generic_skill: "the target skill",
    social_confidence: "social confidence"
  };
  return fallbacks[archetype];
}

const recipes: Record<GoalArchetype, ArchetypeRecipe> = {
  coding: {
    assumptions: ["The exact language, current level, and assessment resource are not yet confirmed."],
    capabilities: [
      capability("baseline", "Baseline accuracy", "Expose the current level before selecting lessons.", "A scored practice attempt with incorrect answers marked.", "critical"),
      capability("problem-solving", "Problem solving", "Convert concepts into working solutions under constraints.", "Solved questions with tests or expected output.", "critical"),
      capability("debugging", "Debugging", "Build the ability to locate and correct faults.", "A defect log showing cause and fix.", "high"),
      capability("delivery", "Project delivery", "Turn isolated knowledge into usable output.", "A runnable feature or small project.", "high"),
      capability("fluency", "Code-entry fluency", "Reduce typing and tool friction that slows practice.", "Recorded code-typing drills and error rate.", "normal")
    ],
    interpretation: (subject) => `Build demonstrable ${subject} ability through assessed practice, error correction, debugging, and shipped output.`,
    successSignals: (subject) => [`Complete increasingly difficult ${subject} problems accurately.`, "Explain and repair repeated mistakes.", "Produce runnable work without following a solution step by step."],
    tasks: codingTasks
  },
  academic_exam: {
    assumptions: ["The exact syllabus coverage and current score are not yet confirmed."],
    capabilities: [
      capability("baseline", "Exam baseline", "Measure knowledge under the target format.", "A timed paper with a score and marked gaps.", "critical"),
      capability("recall", "Active recall", "Retrieve knowledge without relying on rereading.", "Answered recall prompts checked against notes.", "high"),
      capability("correction", "Mistake correction", "Prevent repeated losses on the same concepts.", "A categorized mistake log and corrected answers.", "critical"),
      capability("timing", "Timed execution", "Finish accurately within exam constraints.", "A completed timed section with time and score.", "high")
    ],
    interpretation: (subject) => `Raise performance in ${subject} by measuring the baseline, repairing knowledge gaps, and repeating timed proof.`,
    successSignals: (subject) => [`Higher scores on comparable ${subject} papers.`, "Fewer repeated mistake categories.", "Completion within the required time."],
    tasks: academicTasks
  },
  career: simpleRecipe("career", "career readiness", "Produce evidence that improves selection and interview readiness."),
  fitness: simpleRecipe("fitness", "physical capacity", "Build measurable capacity with safe, repeatable training evidence."),
  social_confidence: simpleRecipe("social", "social confidence", "Increase real-world social repetitions and reflection quality."),
  finance: simpleRecipe("finance", "financial control", "Convert money intentions into recorded decisions and repeatable controls."),
  discipline: simpleRecipe("discipline", "routine reliability", "Make starting and completing planned actions more reliable."),
  generic_skill: simpleRecipe("skill", "applied skill", "Move from vague learning to assessed practice and produced work.")
};

function codingTasks(subject: string): RecipeTask[] {
  return [
    task("coding-resource", "resource_setup", "baseline", `Find and save one ${subject} practice set with solutions`, 20, "easy", `Search for a practice set that matches ${subject}, has at least 10 questions, and includes solutions.`, ["Use the resource query or an equivalent trusted source.", "Check that questions and solutions are both accessible before saving it."], `beginner ${subject} practice questions PDF with solutions`, "A saved file or bookmark and a note recording the source and question count."),
    task("coding-baseline", "baseline_assessment", "baseline", "Complete the first five questions under a 60-minute limit", 60, "normal", "Attempt five questions without reading the solutions first.", ["Start a 60-minute timer.", "Mark each answer correct, incorrect, or incomplete after the timer."], undefined, "Five attempted answers, elapsed time, and a score out of five.", ["coding-resource"]),
    task("coding-typing", "supporting_skill", "fluency", "Complete three five-minute code-typing drills", 20, "easy", "Use a code-typing tool with code snippets rather than ordinary prose.", ["Record the starting accuracy.", "Complete three five-minute drills and record the final accuracy."], "code typing practice with programming snippets", "Three completed drill results with starting and final accuracy."),
    task("coding-mistakes", "review_mistakes", "debugging", "Create a mistake log from the baseline attempt", 30, "normal", "Separate concept gaps, syntax errors, logic errors, and time-pressure errors.", ["Review all incorrect or incomplete answers.", "Write the cause and one correction rule for each error."], undefined, "A mistake log containing every missed question, its cause, and its corrected solution.", ["coding-baseline"]),
    task("coding-debug", "guided_practice", "debugging", `Repair three defects in a small ${subject} exercise`, 45, "normal", "Use a small runnable exercise and diagnose each defect before changing the code.", ["Record the symptom and suspected cause.", "Fix each defect and rerun the relevant output or test."], `${subject} debugging exercises with answers`, "Three repaired defects with cause, changed code, and successful output recorded.", ["coding-baseline"]),
    task("coding-output", "project_output", "delivery", `Build one small working ${subject} feature from the weakest topic`, 90, "hard", "Choose the most repeated weakness from the mistake log and use it in a small feature.", ["Define one visible input and output before coding.", "Finish a runnable version and record one remaining limitation."], undefined, "Runnable code, one demonstrated input/output, and a short note explaining the weak topic used.", ["coding-mistakes"])
  ];
}

function academicTasks(subject: string): RecipeTask[] {
  return [
    task("exam-resource", "resource_setup", "baseline", `Download one recent ${subject} sample paper with answers`, 20, "easy", "Select a paper matching the target syllabus and exam format.", ["Confirm the paper covers the relevant syllabus.", "Save both the paper and its answers or marking scheme."], `${subject} sample question paper with answers PDF`, "The paper and answer key are saved with the exam or syllabus noted."),
    task("exam-baseline", "baseline_assessment", "baseline", "Complete one timed section without notes", 60, "normal", "Use the saved paper and follow its stated marks and timing proportion.", ["Attempt the section without notes.", "Score it immediately using the answer key."], undefined, "Completed answers, elapsed time, score, and unanswered questions.", ["exam-resource"]),
    task("exam-recall", "guided_practice", "recall", `Answer 20 active-recall prompts for ${subject}`, 35, "normal", "Use questions, flashcards, or headings converted into prompts; do not reread first.", ["Answer all 20 prompts from memory.", "Check answers and mark uncertain items."], undefined, "Twenty checked responses and the number answered correctly without hints."),
    task("exam-errors", "review_mistakes", "correction", "Classify and correct every baseline mistake", 40, "normal", "Group errors by missing knowledge, misunderstanding, careless execution, or time pressure.", ["Rewrite each incorrect answer correctly.", "Choose the highest-frequency error category for the next practice task."], undefined, "A categorized mistake list with corrected answers and one selected priority gap.", ["exam-baseline"]),
    task("exam-retest", "timed_practice", "timing", "Retake five questions from the weakest topic", 45, "hard", "Use new questions that test the same weak topic rather than memorizing old answers.", ["Set a strict 45-minute timer.", "Compare accuracy with the baseline weak-topic result."], `${subject} questions on weakest topic with solutions`, "Five timed answers, score, elapsed time, and comparison with the baseline.", ["exam-errors"])
  ];
}

function simpleRecipe(prefix: string, label: string, purpose: string): ArchetypeRecipe {
  return {
    assumptions: ["The current ability level and preferred resources are not yet confirmed, so the first cycle measures a baseline."],
    capabilities: [
      capability("baseline", `${capitalize(label)} baseline`, "Measure the current state with observable evidence.", "A recorded baseline result.", "critical"),
      capability("practice", "Deliberate practice", purpose, "A completed practice output with quantity and quality recorded.", "high"),
      capability("feedback", "Feedback and correction", "Use evidence to choose the next weakness instead of repeating comfortable work.", "A correction note and next experiment.", "high"),
      capability("application", "Real-world application", "Prove the capability outside a learning-only context.", "A completed real-world output or repetition.", "normal")
    ],
    interpretation: (subject) => `${purpose} The current direction is ${subject}.`,
    successSignals: (subject) => [`A measurable improvement in ${subject}.`, "Repeated completion under realistic conditions.", "Fewer repeated errors or avoidance patterns."],
    tasks: (subject) => [
      task(`${prefix}-baseline`, "baseline_assessment", "baseline", `Record one measurable baseline for ${subject}`, 30, "easy", `Choose one result that directly represents ${subject} and measure it once under normal conditions.`, ["Define the measurement before starting.", "Perform one attempt and record the result without improving it afterward."], `${subject} baseline assessment`, "The measurement used, result, conditions, and date are recorded."),
      task(`${prefix}-practice`, "guided_practice", "practice", `Complete one focused ${subject} practice set`, 45, "normal", "Choose a set with a clear quantity and finish condition.", ["Select one subskill exposed by the baseline.", "Complete the defined set and record correct, incorrect, or incomplete units."], `${subject} structured practice exercises`, "The selected subskill, completed quantity, result, and elapsed time are recorded.", [`${prefix}-baseline`]),
      task(`${prefix}-feedback`, "review_mistakes", "feedback", "Review the practice result and select one correction", 20, "easy", "Identify the most important error or source of friction from the practice set.", ["Name the cause using evidence from the attempt.", "Write one concrete change for the next attempt."], undefined, "One evidence-backed cause and one testable correction are recorded.", [`${prefix}-practice`]),
      task(`${prefix}-application`, "real_world_exposure", "application", `Produce one real-world proof of ${subject}`, 60, "hard", "Use the corrected subskill in an output or situation that matters outside the practice exercise.", ["Define what another person or future you can inspect.", "Complete and save the output or record the real-world repetition."], undefined, "A saved output, result, or interaction record demonstrating the subskill.", [`${prefix}-feedback`])
    ]
  };
}

function capability(key: string, label: string, purpose: string, evidence: string, priority: GoalCapability["priority"]): GoalCapability {
  return { evidence, key, label, priority, purpose };
}

function task(
  taskKey: string,
  actionType: RecipeTask["actionType"],
  capabilityKey: string,
  title: string,
  estimatedMinutes: number,
  difficulty: RecipeTask["difficulty"],
  description: string,
  instructions: string[],
  resourceQuery: string | undefined,
  completionEvidence: string,
  dependencyTaskKeys?: string[]
): RecipeTask {
  return { actionType, capabilityKey, completionEvidence, dependencyTaskKeys, description, difficulty, estimatedMinutes, instructions, resourceQuery, taskKey, title };
}

function statWeightsForDomain(domain: LifeDomain): Partial<Record<StatName, number>> {
  const map: Record<LifeDomain, Partial<Record<StatName, number>>> = {
    academics: { focus: 45, intelligence: 55 },
    discipline_routine: { discipline: 70, focus: 30 },
    finance: { discipline: 45, perception: 55 },
    fitness_health: { discipline: 30, vitality: 70 },
    personality_social_confidence: { discipline: 35, perception: 65 },
    skills_career: { focus: 45, intelligence: 55 }
  };
  return map[domain];
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
