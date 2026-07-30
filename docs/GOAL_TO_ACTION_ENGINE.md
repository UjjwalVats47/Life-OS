# Goal-to-Action Intelligence Engine

Updated: 2026-07-30

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
- Versioned local persistence with schema-2 backup compatibility.

## Required Next Phases

1. Add action rejection/edit feedback so the engine learns which generated actions are unsuitable and why.
2. Add type-specific result evidence such as question count, accuracy, distance, repetition count, spending amount, artifact reference, and external feedback.
3. Use schedule timing, repeated error categories, deadline trajectory, and prior action edits in the next-cycle generator.
4. Expand domain knowledge packs and verify named external resources instead of inventing resource names.
5. Add a long-term goal trajectory model so current-cycle completion does not falsely claim complete mastery.
6. Validate local-model quality through personal use before allowing it to generate new action structures rather than refine deterministic candidates.

## Local LLM Boundary

Ollama may propose interpretations, decompositions, resources, and action candidates. It may not directly write to goals, quests, or schedules. Every response must pass the same schema, specificity, duration, dependency, privacy, and safety checks as deterministic actions. Core Life OS operation remains available when Ollama is absent or offline.
