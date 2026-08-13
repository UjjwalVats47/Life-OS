# Goal-to-Action Intelligence Engine

Updated: 2026-08-13

## Core Rule

A goal is a direction, not a task.

```text
Goal
  -> interpretation and assumptions
  -> capabilities and bottlenecks
  -> concrete action candidates
  -> validation and dependency checks
  -> priority and free-block fit
  -> Quest Board and schedule
  -> execution and completion proof
  -> behavior evidence
  -> next generation cycle
```

"Practice coding" is rejected because it has no exact operation, quantity, resource, finish condition, or proof. A valid action is closer to: "Download one suitable coding practice set with solutions, confirm that it contains at least ten questions, and save the source and question count."

## Foundation Implemented

- Goal interpretation across coding, exams, career, fitness, social confidence, finance, discipline, and general skills.
- Explicit capabilities, assumptions, success signals, action types, instructions, resource queries, completion proof, sequence, and dependencies.
- Specificity validation that rejects vague or unschedulable generated actions.
- Deterministic domain recipes that work without an LLM or internet connection.
- Reduced task duration after repeated postponement or incomplete evidence.
- Goal calibration for current level, target outcome, available resources, and constraints.
- Completion evidence for actual duration, inspectable proof, score, felt difficulty, and result notes.
- Challenge adjustment from repeated high scores, low scores, and difficulty feedback.
- Dependency-safe Quest Board generation and automatic free-block placement.
- Automatic next-cycle generation after all actions in the active cycle are completed.
- Selected quest duration is reflected in its schedule slot.
- Goal screen exposes the generated plan and supports regeneration.
- Goal progress display is based on completed actions in the current cycle, not manual percentage buttons.
- Optional Ollama refinement with explicit goal-only context, per-action validation, and deterministic fallback.
- Persistent user feedback that separates a bad System suggestion from failed execution.
- Reason-specific rejection handling: shorten, scaffold, increase challenge, replace unavailable resources, clarify, or suppress.
- User-edited titles, durations, steps, and completion proof preserved across later cycles.
- Completed or started action definitions remain immutable so historical execution evidence is not rewritten.
- Local AI cannot overwrite explicit user edits or feedback-adjusted actions.
- Domain-aware evidence contracts generated with each action instead of a universal self-score form.
- Structured completion measurements for volume, quality, artifacts, external feedback, and execution context.
- Automatic quality calculation from inspectable ratios such as correct/attempted and resolved/identified.
- Evidence validation rejects missing required measurements and impossible relationships.
- Incomplete attempts can retain partial evidence without pretending the action was completed.
- Structured measurements enter later generation history alongside duration, difficulty, and result quality.
- Versioned local persistence with schema-2 and schema-3 backup compatibility.

## Required Next Phases

1. Use schedule timing, repeated error categories, deadline trajectory, and free-text feedback details in the next-cycle generator.
2. Add per-capability measurement targets so volume and quality can advance independently.
3. Expand domain knowledge packs and verify named external resources instead of inventing resource names.
4. Add a long-term goal trajectory model so current-cycle completion does not falsely claim complete mastery.
5. Validate local-model quality through personal use before allowing it to generate new action structures rather than refine deterministic candidates.

## Local LLM Boundary

Ollama may propose interpretations, decompositions, resources, and action candidates. It may not directly write to goals, quests, or schedules. Every response must pass the same schema, specificity, duration, dependency, privacy, and safety checks as deterministic actions. Core Life OS operation remains available when Ollama is absent or offline.
