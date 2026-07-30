# The System: Life OS - Implementation Plan

This document converts the V1 blueprint into implementation-level structure without starting the build. It defines the final folder structure and the first Dexie/IndexedDB local database schema.

Source documents:

- `LIFE_OS_CONCEPT.md`
- `LIFE_OS_V1_BLUEPRINT.md`
- `LIFE_OS_VISION_AND_ROADMAP.md`

Current delivery direction: the original eight milestones establish the V1 personal PWA. Post-V1 work is now defined in `LIFE_OS_VISION_AND_ROADMAP.md`; it begins with shared task semantics and progressive first-week planning rather than adding unrelated screens.

## 1. Final Folder Structure

Recommended project root after implementation starts:

```text
Life OS/
  docs/
    LIFE_OS_CONCEPT.md
    LIFE_OS_V1_BLUEPRINT.md
    LIFE_OS_IMPLEMENTATION_PLAN.md

  public/
    icons/
      icon-192.png
      icon-512.png
      maskable-icon.png
    manifest.webmanifest

  src/
    app/
      App.tsx
      router.tsx
      providers.tsx
      routeTree.gen.ts

    routes/
      __root.tsx
      index.tsx
      awakening.tsx
      dashboard.tsx
      quest-board.tsx
      schedule.tsx
      goals.tsx
      habits.tsx
      hunter-log.tsx
      finance.tsx
      events.tsx
      settings.tsx

    components/
      ui/
        button.tsx
        dialog.tsx
        input.tsx
        select.tsx
        tabs.tsx
        toast.tsx
      layout/
        AppShell.tsx
        BottomNav.tsx
        Sidebar.tsx
        StatusHeader.tsx
      shared/
        EmptyState.tsx
        StatBadge.tsx
        RankBadge.tsx
        XpBar.tsx
        SystemMessage.tsx

    features/
      awakening/
        components/
          AwakeningShell.tsx
          CurrentStateStep.tsx
          FixedBlocksStep.tsx
          GoalsStep.tsx
          PersonalityStep.tsx
          IdentityOptionsStep.tsx
          ProtocolPreviewStep.tsx
        awakeningFlow.ts
        awakeningSchemas.ts

      dashboard/
        components/
          CommandCenter.tsx
          TodayOverview.tsx
          RankPanel.tsx
          UrgentDeadlines.tsx

      quest-board/
        components/
          QuestBoard.tsx
          QuestSlotCard.tsx
          TaskOptionCard.tsx
          TaskStartDialog.tsx
          TaskFinishDialog.tsx
          PhaseThreeDialog.tsx
        questBoardSelectors.ts

      schedule/
        components/
          WeeklyScheduleView.tsx
          ScheduleBlockEditor.tsx
          CommitmentEditor.tsx
        scheduleSchemas.ts

      goals/
        components/
          IdentityCard.tsx
          GoalTree.tsx
          GoalEditor.tsx
          OverrideGateDialog.tsx
        goalSchemas.ts

      habits/
        components/
          HabitStackView.tsx
          HabitCard.tsx
          TargetHabitCard.tsx
          RedirectionPanel.tsx
        habitSchemas.ts

      hunter-log/
        components/
          HunterLogDashboard.tsx
          ProductivityRhythmChart.tsx
          GoalProgressChart.tsx
          MoodStressChart.tsx
          ScheduleInsightPanel.tsx
          SystemInsightCard.tsx

      finance/
        components/
          QuickExpenseEntry.tsx
          WeeklyFinanceSummary.tsx
          SpendingStressPanel.tsx
        financeSchemas.ts

      events/
        components/
          EventEditor.tsx
          EventList.tsx
          PrepPlanReview.tsx
        eventSchemas.ts

      system-chat/
        components/
          SystemChatPanel.tsx
          ChatMessage.tsx
        chatSchemas.ts

      settings/
        components/
          PrivacyPanel.tsx
          DataExportPanel.tsx
          NotificationSettings.tsx
          AiModeSettings.tsx

    db/
      lifeOsDb.ts
      schema.ts
      types.ts
      seed.ts
      migrations.ts
      repositories/
        profileRepo.ts
        personalityRepo.ts
        identityRepo.ts
        goalsRepo.ts
        scheduleRepo.ts
        habitsRepo.ts
        tasksRepo.ts
        gamificationRepo.ts
        analyticsRepo.ts
        financeRepo.ts
        eventsRepo.ts
        notificationsRepo.ts

    system/
      identity/
        identityEngine.ts
        identityPrompts.ts
      scheduling/
        scheduleEngine.ts
        slotDetection.ts
        sundayCatchup.ts
      tasks/
        taskGenerationEngine.ts
        escalationEngine.ts
      habits/
        habitGenerationEngine.ts
        redirectionEngine.ts
      gamification/
        xpEngine.ts
        rankEngine.ts
        statEngine.ts
        resetPointEngine.ts
      analytics/
        productivityEngine.ts
        behaviorPatternEngine.ts
        insightEngine.ts
      ai/
        aiAdapter.ts
        ruleBasedAdapter.ts
        externalAiAdapter.ts
        localAiAdapter.ts
      notifications/
        reminderEngine.ts

    stores/
      appStore.ts
      questBoardStore.ts
      awakeningStore.ts
      modalStore.ts

    types/
      domain.ts
      enums.ts
      ids.ts

    lib/
      dates.ts
      ids.ts
      math.ts
      pwa.ts
      exportImport.ts

    styles/
      globals.css
      theme.css

    test/
      fixtures/
      testDb.ts
      testUtils.tsx

  tests/
    unit/
      xpEngine.test.ts
      rankEngine.test.ts
      resetPointEngine.test.ts
      scheduleEngine.test.ts
      identityEngine.test.ts
    integration/
      awakeningFlow.test.ts
      questSlotFlow.test.ts
    e2e/
      awakening.spec.ts
      quest-board.spec.ts
      pwa.spec.ts

  index.html
  package.json
  tsconfig.json
  vite.config.ts
  vitest.config.ts
  playwright.config.ts
  tailwind.config.ts
  postcss.config.js
```

## 2. Folder Structure Reasoning

- `features/` keeps screen-specific UI and schemas together.
- `system/` contains the Life OS intelligence: scheduling, XP, identity, analytics, reminders, AI adapters.
- `db/` owns Dexie setup, schema, repositories, seed data, and migrations.
- `stores/` is only for temporary UI/application state, not long-term data.
- `routes/` stays thin. Routes compose feature screens instead of containing business logic.
- `components/ui/` contains reusable primitives.
- `components/shared/` contains Life OS-specific reusable components.
- `lib/` contains generic utilities.
- `tests/` separates engine unit tests, workflow tests, and Playwright e2e tests.

## 3. Dexie Local Database Schema

Database name:

```ts
LifeOsLocalDb
```

Initial version:

```ts
version 1
```

All tables should use local string IDs generated with `crypto.randomUUID()` or `nanoid`.

All records should include:

```ts
id: string
createdAt: string
updatedAt: string
```

Use ISO strings for dates in storage. Convert to `Date` objects only inside utility functions.

## 4. Dexie Table Definitions

Proposed Dexie stores:

```ts
db.version(1).stores({
  appMeta:
    'id, key, updatedAt',

  userProfiles:
    'id, onboardingCompleted, activeIdentityPathId, createdAt, updatedAt',

  personalityProfiles:
    'id, userId, mbtiType, openness, conscientiousness, extraversion, agreeableness, neuroticism, createdAt, updatedAt',

  identityPaths:
    'id, userId, status, intensity, createdAt, updatedAt',

  goals:
    'id, userId, system, level, importance, domain, status, deadlineAt, parentGoalId, createdAt, updatedAt',

  scheduleBlocks:
    'id, userId, dayOfWeek, startTime, endTime, blockType, createdAt, updatedAt',

  commitments:
    'id, userId, dayOfWeek, startTime, endTime, commitmentType, domain, goalId, createdAt, updatedAt',

  freeBlocks:
    'id, userId, dayOfWeek, startTime, endTime, sourceHash, createdAt, updatedAt',

  habits:
    'id, userId, goalId, domain, status, frequency, createdAt, updatedAt',

  targetHabits:
    'id, userId, domain, status, severity, createdAt, updatedAt',

  habitDependencies:
    'id, userId, habitId, dependsOnHabitId, dependencyType, createdAt, updatedAt',

  taskTemplates:
    'id, userId, goalId, habitId, eventId, domain, category, status, createdAt, updatedAt',

  questSlots:
    'id, userId, date, dayOfWeek, startTime, endTime, phase, status, createdAt, updatedAt',

  questSlotOptions:
    'id, userId, questSlotId, taskTemplateId, rank, status, createdAt, updatedAt',

  taskAttempts:
    'id, userId, questSlotId, taskTemplateId, status, startedAt, finishedAt, createdAt, updatedAt',

  xpLogs:
    'id, userId, taskAttemptId, goalId, habitId, reason, createdAt',

  statLogs:
    'id, userId, taskAttemptId, stat, createdAt',

  rankSnapshots:
    'id, userId, activeRank, unlockedRank, capturedAt, createdAt',

  streaks:
    'id, userId, streakType, targetId, currentCount, longestCount, lastSuccessDate, updatedAt',

  resetPointLogs:
    'id, userId, taskAttemptId, goalId, reason, createdAt',

  overrideAttempts:
    'id, userId, goalId, status, severity, createdAt, updatedAt',

  moodStressEntries:
    'id, userId, mood, stress, date, timeOfDay, createdAt, updatedAt',

  reflectionNotes:
    'id, userId, moodStressEntryId, date, createdAt, updatedAt',

  financeEntries:
    'id, userId, date, category, domain, goalId, moodStressEntryId, createdAt, updatedAt',

  events:
    'id, userId, eventType, eventDate, importance, status, createdAt, updatedAt',

  eventPrepItems:
    'id, userId, eventId, taskTemplateId, status, scheduledDate, createdAt, updatedAt',

  notifications:
    'id, userId, notificationType, scheduledAt, status, linkedType, linkedId, createdAt, updatedAt',

  systemInsights:
    'id, userId, insightType, severity, date, createdAt, updatedAt',

  aiInteractions:
    'id, userId, mode, tone, contextType, createdAt'
})
```

## 5. Core Table Shapes

### appMeta

Purpose: local app-level metadata.

Fields:

- `id`
- `key`
- `value`
- `createdAt`
- `updatedAt`

Examples:

- database version notes
- last export date
- PWA install dismissed flag

### userProfiles

Purpose: primary local profile.

Fields:

- `id`
- `displayName`
- `onboardingCompleted`
- `activeIdentityPathId`
- `basePersonalTimeHoursPerWeek`
- `currentPersonalTimeHoursPerWeek`
- `createdAt`
- `updatedAt`

Default:

- `basePersonalTimeHoursPerWeek = 7`

### personalityProfiles

Purpose: starting personality lens.

Fields:

- `id`
- `userId`
- `mbtiType`
- `openness`
- `conscientiousness`
- `extraversion`
- `agreeableness`
- `neuroticism`
- `notes`
- `createdAt`
- `updatedAt`

Big Five-style values can use `0-100`.

### identityPaths

Purpose: selected and generated identity options.

Fields:

- `id`
- `userId`
- `name`
- `status`: `suggested | refined | active | archived`
- `transformationPromise`
- `pillars`
- `rewards`
- `attacks`
- `intensity`: `low | medium | high | extreme`
- `systemReason`
- `desiredDirectionInput`
- `createdAt`
- `updatedAt`

JSON-like fields:

- `pillars`
- `rewards`
- `attacks`

### goals

Purpose: sys1/sys2 goals and sub-goals.

Fields:

- `id`
- `userId`
- `system`: `sys1 | sys2`
- `level`: `primary | secondary | tertiary | none`
- `importance`: `critical | negotiable | optional | none`
- `domain`
- `title`
- `description`
- `reason`
- `deadlineAt`
- `timelineMonths`
- `status`: `active | paused | completed | failed | archived`
- `parentGoalId`
- `priorityWeight`
- `progress`
- `createdAt`
- `updatedAt`

Rules:

- sys1 goals use `level`.
- sys2 goals use `importance`.
- a goal can have a parent for split sub-goals.

### scheduleBlocks

Purpose: externally fixed blocks.

Fields:

- `id`
- `userId`
- `dayOfWeek`
- `startTime`
- `endTime`
- `blockType`: `school | work | sleep | meal | commute | coaching | other`
- `title`
- `createdAt`
- `updatedAt`

### commitments

Purpose: self-chosen or System-protected commitments.

Fields:

- `id`
- `userId`
- `dayOfWeek`
- `startTime`
- `endTime`
- `commitmentType`: `fixed | flexible`
- `domain`
- `goalId`
- `title`
- `createdAt`
- `updatedAt`

### freeBlocks

Purpose: generated available slots after fixed blocks.

Fields:

- `id`
- `userId`
- `dayOfWeek`
- `startTime`
- `endTime`
- `sourceHash`
- `createdAt`
- `updatedAt`

Note: free blocks are derived from schedule input. They can be regenerated when schedule changes.

### habits

Purpose: proof habits.

Fields:

- `id`
- `userId`
- `goalId`
- `domain`
- `title`
- `description`
- `frequency`
- `preferredTimeOfDay`
- `status`
- `difficulty`
- `createdAt`
- `updatedAt`

### targetHabits

Purpose: old-identity habits to reduce/redirect.

Fields:

- `id`
- `userId`
- `domain`
- `title`
- `description`
- `severity`
- `status`
- `replacementHabitId`
- `createdAt`
- `updatedAt`

### taskTemplates

Purpose: reusable tasks generated from goals, habits, routines, or events.

Fields:

- `id`
- `userId`
- `goalId`
- `habitId`
- `eventId`
- `domain`
- `title`
- `description`
- `category`: `small | negotiable | critical | deadline_prep | phase3`
- `difficulty`: `easy | normal | hard | very_hard`
- `estimatedMinutes`
- `baseXp`
- `statWeights`
- `status`
- `createdAt`
- `updatedAt`

JSON-like field:

- `statWeights`: `{ intelligence: 0.6, focus: 0.4 }`

### questSlots

Purpose: scheduled daily slot with task options.

Fields:

- `id`
- `userId`
- `date`
- `dayOfWeek`
- `startTime`
- `endTime`
- `phase`: `phase1 | phase2 | phase3`
- `status`: `pending | active | completed | skipped | expired`
- `sourceFreeBlockId`
- `createdAt`
- `updatedAt`

### questSlotOptions

Purpose: the two best-suited task candidates for a slot.

Fields:

- `id`
- `userId`
- `questSlotId`
- `taskTemplateId`
- `rank`: `1 | 2`
- `score`
- `status`: `offered | selected | rejected | expired`
- `systemReason`
- `createdAt`
- `updatedAt`

### taskAttempts

Purpose: execution history.

Fields:

- `id`
- `userId`
- `questSlotId`
- `taskTemplateId`
- `status`: `started | completed | incomplete | skipped | postponed | failed`
- `startedAt`
- `finishedAt`
- `completionTiming`: `early | on_time | late | repeated_postponement | phase3_negotiated`
- `skipReason`
- `incompleteReason`
- `createdAt`
- `updatedAt`

### xpLogs

Purpose: XP gains/losses.

Fields:

- `id`
- `userId`
- `taskAttemptId`
- `goalId`
- `habitId`
- `amount`
- `reason`
- `formulaSnapshot`
- `createdAt`

### statLogs

Purpose: stat changes.

Fields:

- `id`
- `userId`
- `taskAttemptId`
- `stat`: `intelligence | vitality | focus | discipline | perception`
- `amount`
- `createdAt`

### rankSnapshots

Purpose: active/unlocked rank history.

Fields:

- `id`
- `userId`
- `activeRank`
- `unlockedRank`
- `lifetimeXp`
- `recentBehaviorScore`
- `capturedAt`
- `createdAt`

### resetPointLogs

Purpose: reset point earning and spending.

Fields:

- `id`
- `userId`
- `taskAttemptId`
- `goalId`
- `amount`
- `reason`
- `performanceRatio`
- `createdAt`

### overrideAttempts

Purpose: goal override reasoning gate.

Fields:

- `id`
- `userId`
- `goalId`
- `reasonText`
- `status`: `approved_free | approved_penalized | rejected | withdrawn`
- `severity`: `low | moderate | severe`
- `resetPointsCost`
- `xpPenalty`
- `systemResponse`
- `createdAt`
- `updatedAt`

### moodStressEntries

Purpose: mood/stress tracking.

Fields:

- `id`
- `userId`
- `mood`
- `stress`
- `date`
- `timeOfDay`
- `triggerType`
- `createdAt`
- `updatedAt`

Values:

- `mood`: 1-10
- `stress`: 1-10

### financeEntries

Purpose: fast local expense tracking.

Fields:

- `id`
- `userId`
- `amount`
- `currency`
- `category`
- `domain`
- `goalId`
- `moodStressEntryId`
- `note`
- `date`
- `createdAt`
- `updatedAt`

### events

Purpose: deadlines and events.

Fields:

- `id`
- `userId`
- `eventType`: `exam_test | submission | interview | bill_due | birthday_anniversary | user_defined`
- `title`
- `eventDate`
- `importance`: `low | medium | high | critical`
- `details`
- `status`: `planned | active | completed | cancelled`
- `createdAt`
- `updatedAt`

### eventPrepItems

Purpose: approved backward prep plan items.

Fields:

- `id`
- `userId`
- `eventId`
- `taskTemplateId`
- `scheduledDate`
- `status`: `draft | approved | scheduled | completed | skipped`
- `createdAt`
- `updatedAt`

### notifications

Purpose: lightweight v1 reminders.

Fields:

- `id`
- `userId`
- `notificationType`: `task_start | deadline | phase3_warning | end_of_day_reflection | mood_stress_checkin | weekly_review`
- `title`
- `body`
- `scheduledAt`
- `status`: `scheduled | shown | dismissed | completed`
- `linkedType`
- `linkedId`
- `createdAt`
- `updatedAt`

### systemInsights

Purpose: Hunter's Log observations.

Fields:

- `id`
- `userId`
- `insightType`
- `title`
- `body`
- `severity`: `positive | neutral | warning | critical`
- `date`
- `sourceRefs`
- `createdAt`
- `updatedAt`

### aiInteractions

Purpose: optional AI/chat history and audit.

Fields:

- `id`
- `userId`
- `mode`: `rule_based | local_ai | external_ai`
- `tone`: `cold_architect | strategic_mentor | shadow_guard`
- `contextType`
- `inputSummary`
- `outputText`
- `createdAt`

Privacy note: external AI interactions should be explicit because private context may leave the device.

## 6. Schema Design Notes

- `freeBlocks` are stored for explainability but can be regenerated.
- `questSlotOptions` stores exactly why the System offered two tasks.
- `taskAttempts` is the behavioral truth source for analytics.
- `xpLogs`, `statLogs`, and `resetPointLogs` are append-only history.
- `rankSnapshots` records history instead of only storing current rank.
- JSON-like fields are acceptable in IndexedDB/Dexie for arrays and structured snapshots.
- Repositories should hide Dexie details from UI components.
- Engines should accept plain objects and return plain objects, making them easy to test.

## 7. Build Order Checklist

This checklist is the recommended implementation order after the user explicitly says `START`.

### 7.1 Project Foundation

- Scaffold Vite + React + TypeScript app.
- Install and configure Tailwind CSS.
- Install and configure TanStack Router.
- Add app shell with basic responsive layout.
- Add placeholder routes for all main screens.
- Configure PWA manifest and service worker.
- Add base Life OS theme tokens.
- Add lint/test setup.
- Add `docs/` folder and move planning docs there.

### 7.2 Local Database Foundation

- Install Dexie.
- Create `lifeOsDb.ts`.
- Define version 1 database stores.
- Create TypeScript domain types.
- Create repository layer.
- Add seed/default values for ranks, stats, XP rules, and reminder types.
- Add versioned JSON export/import for full local restore.
- Add basic database smoke tests.

### 7.3 Core System Engines

- Build ID/date utilities.
- Build XP engine.
- Build stat engine.
- Build rank engine.
- Build reset point engine.
- Build schedule/free-block detection engine.
- Build task scoring engine for two best-suited options.
- Build escalation engine.
- Build basic identity option generator.
- Build basic habit generation engine.
- Build event prep-plan generator.
- Add unit tests for all engines.

### 7.4 The Awakening

- Build multi-step Awakening shell.
- Build current-state step.
- Build fixed-block input.
- Build fixed-commitment input.
- Build primary/secondary goal input.
- Add secondary-longer-than-primary warning flow.
- Build personality input.
- Build problem areas/target habits step.
- Build events/deadlines step.
- Generate initial identity options.
- Add desired-direction refinement input.
- Generate refined identity options.
- Build protocol preview.
- Save complete Awakening output to Dexie.
- Redirect to dashboard after activation.

### 7.5 Command Center And Quest Board

- Build dashboard layout.
- Show active identity, rank, XP, stats, streaks.
- Build daily schedule timeline.
- Generate quest slots from free blocks.
- Show two task options per slot.
- Build task detail dialog.
- Build task start confirmation.
- Build skip/postpone flow.
- Build finish dialog with completed/incomplete/back.
- Store task attempts.
- Update XP, stats, rank, streaks, and reset points.

### 7.6 Scheduling Rules

- Add Phase 1/2/3 escalation states.
- Add Phase 3 reason/chat confirmation gate.
- Add emergency/recovery replacement path.
- Add Sunday adaptive catch-up logic.
- Add personal-time allowance tracking.
- Add weekly review calculation.

### 7.7 Supporting Screens

- Build Goals + Identity screen.
- Build Habits + Redirection screen.
- Build Schedule screen.
- Build Finance quick entry and weekly summary.
- Build Events screen and prep-plan review.
- Build Settings screen.

### 7.8 Hunter's Log

- Add ECharts.
- Build productivity rhythm view.
- Build goal progress chart.
- Build mood/stress trend chart.
- Build schedule pattern insights.
- Build finance/stress insight panel.
- Build System commentary cards.

### 7.9 Reminders And PWA Polish

- Implement in-app reminders.
- Add browser notification permission flow where supported.
- Add task start reminders.
- Add deadline reminders.
- Add Phase 3 warnings.
- Add end-of-day reflection prompt.
- Add weekly review prompt.
- Reduce production chunk-size warnings through route/code splitting and dependency chunking.
- Test installability and offline app shell.

### 7.10 AI Adapter Layer

- Build rule-based adapter.
- Add chat tone system: Cold Architect, Strategic Mentor, Shadow Guard.
- Add AI adapter interface.
- Keep external AI off by default.
- Allow external AI only through an explicit optional toggle with a privacy warning.
- Add optional local/external adapter placeholders.

### 7.11 Verification

- Run unit tests.
- Run integration tests for Awakening and quest flow.
- Run Playwright tests for first launch, Awakening, Quest Board, and PWA install behavior.
- Test local data persistence after refresh.
- Test versioned export/import validation and local restore controls.
- Test mobile viewport.
- Run the production PWA browser check to verify service-worker activation and an offline reload after first load.

## 8. Testing Plan

Testing should protect the parts of Life OS most likely to break trust: local persistence, System calculations, Awakening, quest execution, PWA behavior, and AI privacy controls.

### 8.1 Unit Tests

Tool: Vitest.

Test the System engines:

- XP engine: base XP, difficulty multiplier, goal-link multiplier, timeliness multiplier, streak bonus, weak-area bonus.
- Rank engine: lifetime unlocked rank and recent active-rank drop behavior.
- Stat engine: multi-stat task splits and stat point calculation.
- Reset point engine: reset points derived from XP performance ratio.
- Schedule engine: fixed blocks, fixed commitments, free blocks, flexible commitments.
- Task scoring engine: exactly two best-suited task options per slot.
- Escalation engine: Phase 1, Phase 2, Phase 3, and Phase 3 skip restrictions.
- Sunday catch-up engine: deadline priority, heavy unfinished-week behavior, lighter good-week behavior, lighter Sunday evening.
- Identity engine: 2-3 identity options depending on confidence and refinement from desired direction.
- Event prep engine: backward prep plan generation from event/deadline date.

### 8.2 Integration Tests

Tool: Vitest with fake IndexedDB or isolated Dexie test database.

Test workflows across database and engines:

- Awakening saves user profile, personality profile, schedule, goals, identity path, target habits, and events.
- Completing Awakening creates dashboard-ready local state.
- Quest slot generation reads schedule/goals and writes quest slots plus two quest slot options.
- Starting and completing a task creates task attempt, XP log, stat log, reset point log, and rank snapshot.
- Skip/postpone flow updates task attempt state and escalation evidence.
- Finance quick entry saves amount, category, optional note, mood/stress link, and goal/life-area link.
- Event prep plan can be generated, approved, and converted into task templates.
- Local data persists after simulated reload.

### 8.3 Component Tests

Tool: React Testing Library.

Test user-facing components:

- Awakening step validation.
- Primary/secondary goal timeline mismatch warning.
- Identity option cards and desired-direction refinement input.
- Quest slot card with two task options.
- Task start dialog.
- Task finish dialog with completed, incomplete, and back choices.
- Phase 3 reason/recovery confirmation dialog.
- Finance quick entry form.
- AI settings toggle warning.

### 8.4 End-To-End Tests

Tool: Playwright.

Test full user scenarios:

- First launch opens local-first intro.
- User completes minimal Awakening.
- Dashboard appears after activation.
- Quest Board shows at least one slot with two task options.
- User starts and completes one task.
- XP, stat, rank, and reset point values visibly update.
- Refresh keeps local data.
- Mobile viewport remains usable.
- PWA manifest and service worker are present.
- External AI is off by default.
- Enabling external AI requires explicit confirmation.

### 8.5 AI Privacy Tests

External AI must be tested as enhancement-only:

- Default AI mode is `rule_based`.
- Core flows work when external AI is unavailable.
- External AI toggle is off on first launch.
- Enabling external AI shows a privacy warning that private context may leave the device.
- No external AI request is made before explicit enablement.
- API keys are not hardcoded in browser/client code.

## 9. Milestones

Expected total: 8 milestones.

### Milestone 1 - App Shell And Local Database

Goal: Life OS opens as an installable local-first app shell.

Done when:

- app runs locally
- routes exist
- basic layout exists
- PWA manifest exists
- Dexie database initializes
- data persists after refresh

### Milestone 2 - Core Engines

Goal: System logic works before UI becomes complex.

Done when:

- XP engine works
- rank engine works
- stat engine works
- reset point engine works
- schedule/free-block detection works
- task scoring works
- unit tests cover core formulas

### Milestone 3 - The Awakening

Goal: user can complete onboarding and activate first protocol.

Done when:

- schedule, goals, personality, problem areas, and events can be entered
- identity options are generated
- user can give desired direction
- refined identity options appear
- selected identity and protocol save locally

### Milestone 4 - First Runnable Life OS

Goal: first meaningful usable version.

This is the first runnable milestone.

Done when:

- app opens
- Awakening can be completed
- dashboard appears
- today's Quest Board is generated
- at least one slot shows two task options
- user can start and complete a task
- XP, stat points, rank, and reset points update
- local data persists after refresh

This milestone proves the core identity-to-action loop.

### Milestone 5 - Scheduling Discipline

Goal: Life OS starts enforcing behavior.

Done when:

- skip/postpone works
- Phase escalation works
- Phase 3 requires reason or emergency/recovery replacement
- Sunday catch-up logic exists
- personal time adjusts weekly

### Milestone 6 - Supporting Life Areas

Goal: v1 domains are usable beyond tasks.

Done when:

- Goals + Identity screen works
- Habits + Redirection screen works
- Finance quick entry works
- weekly finance summary works
- Events/deadlines work
- event prep plans can be approved/edited

### Milestone 7 - Hunter's Log

Goal: behavior becomes visible.

Done when:

- productivity rhythm appears
- schedule pattern insights appear
- goal progress charts appear
- mood/stress trends appear
- finance/stress links appear
- System commentary appears

### Milestone 8 - PWA, Reminders, Chat, Polish

Goal: v1 becomes app-like and coherent.

Done when:

- PWA install behavior is tested
- production service-worker activation and offline reload are tested
- offline app shell works
- reminder types are implemented
- in-app reminder center can show, complete, and dismiss due reminders
- rule-based System chat exists
- tones work by context
- local export/import works through Settings
- mobile layout is usable
- production chunk-size warnings are reduced or intentionally documented
- Playwright checks pass

## 10. First Runnable Milestone

The first runnable milestone is **Milestone 4 - First Runnable Life OS**.

Minimum experience:

1. Open Life OS.
2. Complete The Awakening.
3. Select refined identity path.
4. Reach dashboard.
5. See today's quest slots.
6. Pick one of two task options.
7. Start the task.
8. Complete the task.
9. See XP/stat/rank/reset-point changes.
10. Refresh the app and confirm data remains.

This is the first point where the app becomes meaningfully testable as Life OS rather than only a shell or form system.
