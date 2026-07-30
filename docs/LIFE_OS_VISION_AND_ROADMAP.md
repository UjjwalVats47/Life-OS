# The System: Life OS - Product Vision And Delivery Roadmap

Updated: 2026-07-29

This document turns the competitive research into a focused product direction. It replaces the old assumption that the product should grow by adding screens. Life OS should grow by making its transformation loop more accurate, explainable, and useful.

## 1. Product Vision

**The System: Life OS is a private personal growth operating system that decomposes meaningful goals into concrete, verifiable real-world actions, schedules those actions within real constraints, learns from execution evidence, and improves the next actions without making the user maintain a complicated productivity tool.**

A goal is never used as a task. "Become good at coding" is a direction. Valid System actions are concrete proofs such as finding a suitable question set, completing five questions under a timer, recording mistakes, repairing three defects, or completing code-typing drills. Identity change is the accumulated result of executing these generated actions.

Life OS is not primarily:

- a generic todo list;
- a habit tracker with game visuals;
- an AI calendar that silently moves work around;
- an all-in-one workspace;
- a system for punishing a user after a bad day.

Its core promise is **adaptive identity transformation**. A student, for example, should be able to move from "I am mediocre at study and sport" to visible evidence of being a disciplined learner and healthier person through achievable, structured, repeated action.

## 2. The Transformation Loop

```text
Reality and goals
        |
        v
Evidence-backed identity direction
        |
        v
Weekly plan within real constraints
        |
        v
Daily quests, routines, recovery, and deadline preparation
        |
        v
Completion, postponement, duration, and reason evidence
        |
        v
Explainable adjustments, reviews, and one experiment
        |
        +---------------------> next weekly plan
```

Every future feature must improve at least one link in this loop. If it does not, it is lower priority no matter how visually attractive it is.

## 3. Design Principles

1. **Reality before motivation.** Fixed blocks, deadlines, capacity, and recovery constrain the plan before gamification is applied.
2. **Identity needs evidence.** A title becomes meaningful only when it has repeatable behaviors and measurable proof.
3. **One shared task model.** Schedule, quests, habits, events, reminders, XP, reset points, and analytics must describe the same work instead of maintaining separate copies.
4. **Firm but not punitive.** The System can require a reason, offer recovery, and reduce rewards; it must not treat a difficult week as moral failure.
5. **Adaptation must be bounded and visible.** The System can adjust flexible work within declared limits, but must show why and never quietly erase important commitments.
6. **Analytics answer a question.** Every insight needs evidence, sample size, confidence, an alternative explanation, and one recommended experiment.
7. **Local data belongs to the user.** IndexedDB remains the source of truth. External AI is optional and receives only intentionally selected context.
8. **Progress survives imperfection.** Streaks are motivating display data; habit strength and real goal progress are the durable measures.

## 4. Product Map

| Layer | Current foundation | Next capability | Later capability |
| --- | --- | --- | --- |
| Awakening | Goals, schedule, identity, personality, events | Progressive onboarding and first-week plan | Behaviour-led identity regeneration |
| Execution | Quest slots, XP, stats, rank, reset points | Shared task semantics, actual duration, reasons | Personalised task difficulty and friction prediction |
| Schedule | Fixed/free blocks and weekly review | Flexible windows, buffers, bounded repair | Calendar and ActivityWatch imports |
| Habits | Habit list, streaks, redirection | Habit strength, dependencies, recovery-safe routines | Context-aware habit experiments |
| Insights | Basic Hunter's Log | Confidence-rated patterns and experiments | Longitudinal identity and life-area correlations |
| Support | Finance, events, reminders, System chat | Deadline risk, reminder preferences, review workflows | Optional encrypted backup/sync and local AI |

## 5. Research-Derived Ideas Worth Building

### Implement in V2

- **Progressive Awakening:** get to a usable first week early; ask deeper personality and calibration questions gradually.
- **Task and commitment semantics:** distinguish fixed block, fixed commitment, flexible commitment, routine, recovery, deadline preparation, and quest.
- **Planned versus actual duration:** use actual execution data to detect bad estimates instead of assuming non-completion means laziness.
- **Habit strength:** preserve the effect of long-term consistency without turning one missed day into a full reset.
- **Two different weekly reviews:** midweek calibration for capacity and deadline repair; weekend review for identity evidence and next-week direction.
- **Deadline trajectory:** warn early when an exam, assignment, interview, bill, or personal event is drifting behind preparation requirements.
- **Confidence-rated Hunter's Log:** show evidence and one small behavioral experiment rather than decorative charts.
- **Recovery mode:** distinguish overload, illness, emergency, and normal avoidance so the response matches reality.

### Implement after V2 has been used personally

- Calendar import with explicit permission and a clear ownership boundary.
- ActivityWatch or manual screen-time import adapters. The PWA itself cannot observe full-device activity.
- Encrypted backup, then carefully designed optional sync.
- On-device AI exploration and a more capable optional external AI adapter.
- Dashboard density controls and user-selected interface scale.

### Do not build yet

- Social feed, collaborative teams, or public comparisons.
- Cosmetics economy, marketplace, large inventories, or collectible systems.
- Financial punishments.
- Automatic full-device monitoring from the browser.
- A cloud-first user account system.
- AI that receives the complete personal database by default.

## 6. Milestone 8 Completion Gate

Milestone 8 is complete only after the following are verified:

- production build produces a manifest and service worker;
- a production-browser check proves the service worker activates and the app shell reloads offline after an initial online visit;
- manifest configuration declares standalone installation behavior;
- reminders, rule-based chat, and local export/import work;
- desktop and mobile automated checks pass;
- no production chunk-size warning remains, or a deliberate exception is documented.

The install button or browser prompt is intentionally not treated as a reliable automated signal because it is controlled by the browser. The manifest, service worker activation, and offline shell are the technical acceptance evidence; actual installation can still be spot-checked on the target device before regular personal use.

## 7. Revised Delivery Plan

### Release 1.0 - Reliable Personal PWA

Purpose: finish the current v1 so it is safe to use with real personal data.

1. Complete Milestone 8 manual offline/install acceptance.
2. Add backup restore confirmation and clearer data-loss wording.
3. Add reminder timing preferences and avoid noisy default reminders.
4. Run a personal two-week trial with exported backups.

Exit condition: the app installs, opens offline after first visit, retains data, restores a tested backup, and supports the current daily flow without confusing failures.

### V2.0 - Behavioral Core

Purpose: make Life OS adapt to the user's life rather than merely record it.

#### Milestone 9 - Unified Work Model

- Introduce one shared task/commitment model for schedule, quests, routines, event preparation, and reminders.
- Add `minimum`, `preferred`, and `maximum` duration; flexibility; priority; deadline risk; and identity/goal links.
- Record planned duration, actual duration, outcome, and reason where needed.
- Migrate existing generated items safely and keep old local data readable.

Exit condition: one item can appear in the schedule, quest board, habit context, event prep, reminder center, and analytics without duplicate logic.

#### Milestone 10 - Progressive Awakening And First-Week Protocol

- Reorder Awakening into context, direction, identity, and first-plan passes.
- Generate a realistic first-week schedule with buffers, recovery, and deadline preparation.
- Spread personality refinement over subsequent use rather than blocking activation.
- Explain why each identity option was generated and what trade-off it implies.

Exit condition: a new user reaches a credible first week in under roughly ten minutes and understands why the System made its choices.

#### Milestone 11 - Bounded Schedule Adaptation

- Add flexible time windows, duration ranges, and transition buffers.
- Add repair suggestions for postponed work, deadline risk, and unexpected overload.
- Protect fixed blocks and require a reason to alter fixed commitments.
- Add recovery mode and adaptive Sunday planning.

Exit condition: the System can propose a repair plan that preserves priorities without silently rearranging the user's day.

#### Milestone 12 - Habit Strength, Reviews, And Recovery

- Replace streak-only judgement with habit-strength calculations.
- Add routine dependencies and recovery-safe alternatives.
- Implement distinct midweek calibration and weekend identity review workflows.
- Tie reset-point restoration and personal-time adjustment to observed capacity, not punishment.

Exit condition: one missed day does not erase progress, while repeated avoidance still receives an honest, proportionate response.

#### Milestone 13 - Explainable Hunter's Log

- Add confidence, sample size, observation window, and alternative explanation to insights.
- Add planned-versus-actual duration patterns, schedule timing patterns, and deadline trajectory.
- Surface exactly one recommended behavioral experiment at a time.
- Provide delete/rebuild controls for derived analytics where practical.

Exit condition: the user can understand what the System observed, why it believes it, and what to try next.

### V2.1 - Personal Integrations And Trust

Purpose: expand evidence sources without compromising privacy or reliability.

14. Calendar import adapter and conflict preview. **Foundation complete.**
15. Goal-to-Action Intelligence Engine. **Deterministic, execution-evidence, cycle-adaptation, and optional Ollama foundations complete; personal calibration remains in progress.**
16. Manual screen-time entry and ActivityWatch import research prototype.
17. Encrypted backup design and recovery testing.
18. Optional local/external AI improvements using explicit context selection.

Milestone 15 takes priority over milestones 16-18. Its exit condition is not merely that the app can generate task titles. The System must interpret a goal, expose assumptions, identify capabilities and bottlenecks, generate specific actions with completion proof, respect dependencies, schedule only eligible work, capture result quality, and use that evidence to improve the next generation cycle. Optional Ollama support belongs inside this engine but may never become a requirement for core operation.

### V3 - Optional Advanced Platform

Purpose: only after personal daily use proves the core model.

- User-controlled encrypted multi-device sync.
- Native companion only if full-device observation is still genuinely needed.
- Fine-grained dashboard density and accessibility settings.
- Optional trusted-accountability features, never a public social feed by default.

## 8. What Can Be Finished By Tomorrow

The realistic target is a strong **V2 foundation**, not every V2 milestone.

By tomorrow, the project can reasonably reach:

1. Milestone 8 fully accepted and documented.
2. Milestone 9 shared model designed and largely implemented.
3. Milestone 10 first-week protocol started, with the initial generated schedule visible.

Claiming a complete V2 by tomorrow would be false unless we reduce V2 to those first two milestones. The remaining work needs real personal use because schedule adaptation and behavioral insights cannot be validated honestly against fabricated data alone.

## 9. Success Measures

During personal testing, Life OS should prove:

- the user can plan and execute a day without maintaining duplicate lists;
- missed work produces a clear repair or recovery option, not confusion;
- the schedule becomes more realistic after enough execution data;
- identity wording corresponds to observable actions;
- insights cause at least one useful schedule, habit, or task-definition adjustment;
- local data can be exported and restored reliably.
