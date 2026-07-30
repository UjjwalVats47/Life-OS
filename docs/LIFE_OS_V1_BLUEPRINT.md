# The System: Life OS - V1 Product Blueprint

Source document: `LIFE_OS_CONCEPT.md`

This blueprint translates the Life OS concept into a first-build product plan. It defines what v1 should contain, how the main flows should work, and what should be deferred. It is still pre-implementation planning, not code.

## 1. V1 Mission

V1 must prove the core transformation loop:

1. The user completes The Awakening.
2. The System understands schedule, goals, personality, problem areas, and deadlines.
3. The System generates identity options.
4. The user gives desired direction and chooses a refined identity path.
5. The System creates initial goals, habits, routines, and quest candidates.
6. The daily/weekly quest board assigns two best-suited options per slot.
7. The user starts, skips, completes, or marks tasks incomplete through controlled flows.
8. XP, stats, rank, streaks, reset points, and behavioral evidence update.
9. Hunter's Log reveals patterns and adapts future scheduling.

The v1 app should feel like a personal transformation command center, not a generic todo app.

## 2. V1 Product Boundaries

### Must Have

- Local-first personal data storage.
- PWA installability from the first build.
- The Awakening onboarding.
- Identity generation and selection flow.
- Goals with sys1/sys2 structure.
- Schedule model with fixed blocks, fixed commitments, free blocks, and flexible commitments.
- Daily/weekly quest board.
- Two best-suited task options per slot.
- Task start/skip/finish confirmation flows.
- XP, rank, stats, streaks, and reset points.
- Habit generation and basic habit redirection.
- Hunter's Log with basic behavioral and schedule-pattern insights.
- Finance quick entry.
- Event/deadline entry and suggested prep plans.
- Lightweight reminders.
- Hybrid AI architecture: rule-based core, optional AI for richer reasoning.

### Should Have Soon After V1 Core

- More advanced habit dependency adjustment.
- Richer behavioral analytics.
- Better identity regeneration using AI.
- Local/on-device AI exploration.
- More polished notification timing.
- Data export/import.

### Not V1

- Bank sync.
- Automatic payment/SMS reading.
- Investment tracking.
- Multi-user accounts.
- Social challenges.
- Cloud sync by default.
- Full native mobile app.
- Deep medical/mental-health intervention.

## 3. Core Screens

### 3.1 First Launch / Local Vault

Purpose: explain local-first setup and create the user's local Life OS profile.

Should show:

- Life OS name and status-window style first impression.
- Local-first privacy note.
- Start Awakening button.
- Versioned JSON export/import from Settings for full local backup and restore.

### 3.2 The Awakening

Purpose: collect reality, infer identity direction, and activate the first System protocol.

The Awakening should feel like a guided diagnostic, not a normal settings form.

Screens:

1. Opening: explain Awakening and identity transformation.
2. Current state: user describes current identity/problem state.
3. Fixed blocks: school, work, sleep, commute, meals, recurring obligations.
4. Fixed commitments: protected study windows, recurring workout windows, routines.
5. Primary goals: title, domain, deadline option, importance, reason.
6. Secondary goals: title, domain, timeline in months, reason.
7. Timeline hierarchy review: warn if secondary timeline is longer than primary.
8. Problem areas and target habits: bad habits, blockers, avoidance patterns.
9. Personality profile: known 16Personalities type plus short Big Five-inspired questions.
10. Events/deadlines: exams/tests, submissions, interviews, bills, birthdays, user-defined.
11. System analysis: detected free blocks, possible domains, early risks.
12. Initial identity options: 2-3 options depending on System confidence.
13. Desired direction input: user corrects or guides identity generation.
14. Refined identity options: regenerated options based on direction.
15. Final identity selection.
16. Initial protocol preview: goals, habits, routines, weekly structure, stat emphasis.
17. Activate System.

### 3.3 Command Center / Dashboard

Purpose: first screen after Awakening.

Should show:

- active identity path
- active rank and unlocked rank
- XP progress
- stats: Intelligence, Vitality, Focus, Discipline, Perception
- current streak state
- today's quest slots
- urgent deadlines
- next fixed commitment
- reminder center
- quick finance entry
- short System commentary

### 3.4 Quest Board

Purpose: daily execution.

Should show:

- today's schedule timeline
- fixed blocks
- fixed commitments
- free/flexible slots
- two best-suited task options per slot
- task category: Critical, Negotiable, Small
- XP estimate
- stat impact
- goal/routine link
- escalation phase

The Quest Board is the main daily work surface.

### 3.5 Schedule

Purpose: view and adjust weekly structure.

Should show:

- weekly layout
- fixed blocks
- fixed commitments
- flexible commitments
- free blocks
- Sunday catch-up/rest logic
- upcoming deadline pressure

V1 should allow editing, but edits to important fixed commitments can trigger System review if they affect core goals.

### 3.6 Goals And Identity

Purpose: inspect transformation structure.

Should show:

- chosen identity card
- identity pillars
- sys1 primary/secondary/tertiary goals
- sys2 critical/negotiable/optional goals
- goal progress
- linked habits
- override/free-attempt status
- reset point progress

### 3.7 Habits And Redirection

Purpose: manage proof habits and old-identity habits.

Should show:

- proof habits
- old-identity habits
- habit stacks
- dependencies
- replacement suggestions
- redirection progress

V1 redirection can be simple: track bad habit, show consequence/context, suggest replacement, schedule replacement.

### 3.8 Hunter's Log

Purpose: analytics and self-understanding.

Should show:

- productivity rhythm
- best productive times
- weak/avoidance-heavy time windows
- completion rate
- on-time rate
- streak trends
- goal progress lines
- mood/stress trends
- finance/stress link
- schedule realism insights
- System one-liner commentary

Hunter's Log should explain behavior, not only display charts.

### 3.9 Finance

Purpose: fast expense capture and weekly finance awareness.

V1 fields:

- amount
- category
- optional note
- linked mood/stress
- linked goal or life area
- date/time

Should show:

- quick-add expense
- weekly summary
- stress-linked spending patterns
- goal/life-area spending summaries

### 3.10 Events And Deadlines

Purpose: track upcoming events and generate prep plans.

V1 event types:

- exams/tests
- assignment/project submissions
- interviews
- bill/payment due dates
- birthdays/anniversaries
- user-defined events/deadlines

Flow:

- user adds event
- System asks lightweight details
- System generates backward prep plan
- user approves/edits/reduces/intensifies
- approved prep tasks enter schedule

### 3.11 System Chat

Purpose: context-specific guidance, not only general chat.

Tones:

- Cold Architect: default
- Strategic Mentor: mood-sensitive guidance
- Shadow Guard: rare, for low mood, addiction, repeated refusal, or bad days

V1 should use rule-based responses for core flows and optional AI for richer reflections.

### 3.12 Settings

Purpose: control local app behavior.

Should include:

- privacy/local-first status
- versioned local export/import
- reminder preferences
- PWA install status/help
- AI mode preference: rule-based only, optional external AI, local AI later
- theme or display options

## 4. Key Data Objects

These are plain-English product objects, not final database tables.

### User Profile

Stores the personal local profile, display name, onboarding status, and basic preferences.

### Personality Profile

Stores known 16Personalities/MBTI-style type if provided and Big Five-inspired trait scores from Awakening.

Used as initial behavioral lens only. Real behavior should override it over time.

### Identity Path

Stores selected identity name, transformation promise, pillars, rewards, attacks, intensity, and System reason.

### Goal

Stores sys1/sys2 classification, title, domain, deadline/timeline, reason, priority, status, progress, and linked habits/tasks.

### Schedule Block

Represents externally fixed time:

- school
- work
- sleep
- commute
- meals

### Commitment

Represents protected or flexible commitments inside otherwise free time:

- fixed commitment
- flexible commitment

### Free Block

Detected time left after fixed blocks. Can contain commitments, quest options, recovery, or personal time.

### Habit

Proof behavior linked to identity and goals.

### Target Habit

Old-identity behavior to reduce or redirect.

### Task Template

Reusable task definition generated from a goal, habit, event, or routine.

### Scheduled Quest Slot

A specific slot in the day/week containing one or two best-suited task options.

### Task Attempt

Tracks start, skip, postpone, completion, incomplete status, timing, and reason.

### XP Log

Records XP earned/lost and why.

### Stat Log

Records Intelligence, Vitality, Focus, Discipline, and Perception changes.

### Rank State

Stores unlocked rank and active rank.

### Reset Point Log

Records reset points earned from important goals/routines and whether a free override attempt was restored.

### Mood/Stress Entry

Stores mood, stress, reason, notes, and relevant time.

### Finance Entry

Stores amount, category, note, mood/stress link, and goal/life-area link.

### Event/Deadline

Stores event type, date, importance, details, and generated prep plan.

### Notification

Stores reminder type, timing, read/dismissed state, and linked object.

### Reflection Note

Stores end-of-day or mood-drop explanations.

### System Insight

Stores generated observations for Hunter's Log.

## 5. Awakening Output

After The Awakening, the System should create:

- user profile
- personality starting profile
- current identity evidence
- selected identity path
- initial sys1 goals
- initial sys2 goals
- detected fixed blocks
- detected free blocks
- fixed commitments
- flexible commitments
- proof habits
- target habits
- initial task templates
- initial weekly quest structure
- event prep drafts
- starting rank/stats
- reminder schedule

## 6. Main Workflows

### 6.1 Daily Quest Slot Flow

1. User opens Quest Board.
2. Slot shows two best-suited task options.
3. User taps slot.
4. Task detail window opens.
5. User taps Start on one task.
6. Confirmation asks if user wants to start.
7. If confirmed, task attempt begins.
8. On finish, user chooses completed, incomplete, or back.
9. System calculates XP, stats, streaks, reset points, and behavioral evidence.

### 6.2 Skip/Postpone Flow

1. User taps skip for a slot.
2. System treats it as postponement.
3. System may show alternative: mood refresh, music, photography, personal time, or replacement task.
4. Postponement count and behavior evidence update.
5. Task may be rescheduled.
6. After repeated postponement, escalation increases.

### 6.3 Phase 3 Flow

1. Task reaches Phase 3 due to postponement/deadline pressure.
2. Casual skip is removed.
3. User must provide a reason through chat/system confirmation.
4. Replacement is allowed only as emergency/recovery option.
5. XP/rank consequences may apply.

### 6.4 Sunday Flow

1. System checks deadlines first.
2. Deadline-related tasks get Sunday priority.
3. If many weekly tasks are unfinished, Sunday becomes heavier.
4. If week was good, Sunday stays lighter.
5. Sunday evening is protected for rest as much as possible.

### 6.5 Finance Quick Entry Flow

1. User taps quick finance entry.
2. Enters amount and category.
3. Optionally links mood/stress.
4. Optionally links goal/life area.
5. Entry appears in weekly summary and Hunter's Log.

### 6.6 Event Prep Flow

1. User adds event/deadline.
2. System asks lightweight details.
3. System generates backward prep plan.
4. User approves/edits/reduces/intensifies.
5. Approved tasks enter schedule.
6. Tasks escalate as deadline approaches.

### 6.7 End-Of-Day Reflection Flow

1. System asks for mood/stress check-in.
2. If mood dropped, System asks why.
3. User can write note.
4. System stores reflection.
5. Hunter's Log uses it for later insights.

### 6.8 Weekly Review Flow

1. System reviews completed, skipped, postponed, and failed tasks.
2. Calculates weekly streak/progress.
3. Adjusts active rank if needed.
4. Updates personal time allowance.
5. Identifies best productive times and weak windows.
6. Prepares next week.

## 7. Gamification Defaults

### XP Base

- Small routine: 10 XP
- Negotiable task: 25 XP
- Critical task: 45 XP
- Deadline/event prep task: 55 XP
- Phase 3 mandatory task: 65 XP

### XP Multipliers

Difficulty:

- Easy: 0.8x
- Normal: 1.0x
- Hard: 1.25x
- Very hard/long/tedious: 1.5x

Goal link:

- `sys1_primary`: 1.4x
- `sys1_secondary`: 1.2x
- `sys1_tertiary`: 1.0x
- `sys2_critical`: 1.15x
- `sys2_negotiable`: 1.0x
- `sys2_optional`: 0.85x
- no important goal/routine link: 0.6x

Timeliness:

- completed early: 1.1x
- completed on time: 1.0x
- completed late: 0.7x
- repeated postponement: 0.5x
- Phase 3 after negotiation: 0.6x

Streak:

- 3-day streak: +10%
- 7-day streak: +20%
- 14-day streak: +30%
- 30-day streak: +50%

Weak area:

- weak-area task: +15%
- personality/social confidence task: +20%

Formula:

`final XP = round(base XP * difficulty * goal-link * timeliness * streak * weak-area)`

### Rank Thresholds

- E: 0 XP
- D: 300 XP
- C: 900 XP
- B: 2,000 XP
- A: 4,000 XP
- Elite: 7,000 XP
- Knight: 11,000 XP
- Commander: 16,000 XP
- S: 23,000 XP
- General: 32,000 XP
- Monarch: 45,000 XP

V1 uses:

- unlocked rank from lifetime XP
- active rank from recent 14-day behavior

### Stats

Stats:

- Intelligence
- Vitality
- Focus
- Discipline
- Perception

Base stat points:

- Small routine: 1
- Negotiable: 2
- Critical: 4
- Deadline/event prep: 5
- Phase 3: 6

Tasks can affect multiple stats.

### Reset Points

Expected reset points:

- `sys1_primary` task: 8
- `sys1_secondary` task: 5
- `sys1_tertiary` task: 3
- important fixed routine: 3
- `sys2_critical` task: 2
- difficult lower-priority task: 1
- ordinary task: 0

Formula:

`earned reset points = round(expected reset points * (actual XP earned / expected full XP))`

Reset thresholds:

- stable behavior: 60 points restores 1 free override attempt
- moderate avoidance: 80 points
- severe avoidance/override abuse: 110 points

### Personal Time

Base weekly amount: 7 hours.

Adjustment:

- good week: +1 hour possible
- average week: stable
- avoidance-heavy week: -1 hour possible
- high stress/low mood: preserve recovery but avoid unstructured avoidance

## 8. Identity Option Card Style

Each generated identity should appear as a card, not just a name.

Card fields:

- identity name
- transformation promise
- core pillars
- what it rewards
- what it attacks
- intensity
- System reason

Example:

**Disciplined Scholar-Athlete**

Becomes: A high-performing student with visible physical discipline.

Pillars: Academics, fitness/health, discipline/routine.

Rewards: daily study streaks, training consistency, on-time routines.

Attacks: procrastination, weak physical consistency, scattered evenings.

Intensity: High.

System reason: Your goals combine academic improvement and body/energy improvement with a clear deadline.

## 9. Reminder Scope

V1 reminder types:

- task start reminders
- deadline reminders
- Phase 3 warnings
- end-of-day reflection prompt
- mood/stress check-in prompt
- weekly review prompt

Reminders should be useful, not noisy.

## 10. Build Phases

## 10. Recommended Tech Stack

This stack is chosen for a local-first, PWA-installable, personal-use Life OS.

### Core App

- Framework: React + TypeScript
- Build tool: Vite
- App type: client-side SPA/PWA
- Package manager: pnpm

Reason: Life OS v1 does not need a cloud backend or server-rendered app. A Vite React SPA keeps the app fast, local-first, and easier to install as a PWA.

### Routing

- TanStack Router

Reason: Life OS has several app-like screens and benefits from type-safe routing, nested layouts, and search-param state.

### Local Database

- Primary v1 choice: IndexedDB through Dexie.js
- Later possible upgrade: SQLite WASM/OPFS if analytics or querying becomes too complex

Reason: Dexie gives a practical local-first browser database over IndexedDB. SQLite WASM/OPFS is powerful, but heavier for the first build.

### State And Forms

- UI/session state: Zustand
- Forms: React Hook Form
- Validation: Zod

Reason: Awakening has many structured forms, and local-first data needs validation before it becomes part of the System.

### Styling And UI

- Tailwind CSS
- shadcn/ui-style component approach
- Radix primitives where needed
- lucide-react icons
- custom Life OS dark/system theme

Reason: The app needs polished controls and a consistent Solo Leveling/status-window feeling without building every primitive from scratch.

### Charts And Analytics

- Primary v1 choice: Apache ECharts
- Simpler fallback: Recharts
- Custom CSS grid heatmaps for simple productivity rhythm views

Recommendation: use ECharts if Hunter's Log is treated as a core v1 feature, because Life OS needs productivity rhythm views, heatmaps, multi-line progress charts, mood/stress trends, and richer interactive analytics. Use Recharts only if the first prototype intentionally keeps charts simple.

### PWA

- vite-plugin-pwa
- Web App Manifest
- Service worker for offline app shell and cached assets

Important: PWA offline support should cache the app shell, not leak or sync private data by default.

### Notifications

- In-app reminders from local schedule data
- Browser/PWA notifications where supported
- Service worker notifications where supported

Important: web notifications and background behavior vary by browser/device. V1 should not promise perfect native-phone alarm reliability.

### AI

- Core System logic: TypeScript rule engine
- AI integration shape: adapter interface
- Optional local AI: Ollama on desktop, browser/local model exploration later
- Optional browser AI: Transformers.js or WebLLM-style integration can be explored
- Optional external AI: behind explicit user choice, preferably through a local proxy or secure adapter rather than exposing API keys in browser code

Important: external AI may send private context outside the device. The app should make this explicit.

Also important: API keys should not be hardcoded into the client app or exposed through public build variables.

### Date And Scheduling Utilities

- date-fns for date/time calculations
- nanoid or crypto.randomUUID for local IDs

Reason: Life OS depends heavily on deadlines, weekly slots, streaks, Sunday catch-up, and recurring commitments. Date logic should use reliable utilities rather than handwritten date math.

### Testing

- Unit tests: Vitest
- Component tests: React Testing Library
- End-to-end/PWA/mobile checks: Playwright

### Data Backup

- JSON export/import should be added early.
- Encrypted export can be considered after the first working local version.
- WebCrypto can be considered for encrypted local backups later.

Important: local-first browser data can still be lost if the browser profile/storage is cleared. Export/backup is important.

### Not Recommended For V1

- Next.js full-stack app: adds server/cloud assumptions that v1 does not need.
- Supabase/Firebase-first architecture: useful later, but conflicts with local-first/private-by-default v1.
- Electron/Tauri as the first target: useful later for desktop power features, but PWA is already required and mobile access matters.

## 11. Build Phases

### Phase 1 - Foundation

Goal: make the local-first PWA shell and core data model.

Deliverables:

- app scaffold
- local data storage
- PWA install support
- basic navigation
- visual direction
- core objects and seed defaults

### Phase 2 - The Awakening

Goal: complete onboarding and generate first protocol.

Deliverables:

- Awakening screens
- schedule input
- goal input
- personality input
- target habit input
- event input
- identity generation/refinement
- protocol preview

### Phase 3 - Quest Board

Goal: make daily execution work.

Deliverables:

- schedule timeline
- two task options per slot
- task start confirmation
- skip/postpone flow
- finish/incomplete flow
- basic escalation

### Phase 4 - Gamification

Goal: make actions produce visible growth.

Deliverables:

- XP calculations
- stat calculations
- rank thresholds
- active vs unlocked rank
- streaks
- reset points
- personal-time adjustment

### Phase 5 - Goals, Habits, Events, Finance

Goal: build supporting management screens.

Deliverables:

- goals/identity screen
- habit/redirection screen
- event prep planner
- finance quick entry
- weekly finance summary

### Phase 6 - Hunter's Log

Goal: make behavior visible.

Deliverables:

- productivity rhythm
- schedule pattern insights
- mood/stress trends
- goal progress
- finance/stress insights
- System commentary

### Phase 7 - System Chat And Polish

Goal: make Life OS feel guided and coherent.

Deliverables:

- context-aware chat surfaces
- Cold Architect responses
- Strategic Mentor responses
- Shadow Guard recovery behavior
- improved reminders
- mobile/PWA polish

## 12. V1 Success Criteria

V1 is successful when:

- The Awakening can create a complete first identity protocol.
- The user can see today's schedule and quests.
- Each slot can show two best-suited task options.
- The user can start, skip, complete, or mark tasks incomplete.
- XP, stats, rank, streaks, and reset points update.
- Sunday catch-up logic exists.
- Finance quick entry works.
- Events can generate editable prep plans.
- Hunter's Log shows at least basic schedule and behavior patterns.
- Data remains local-first.
- The app is installable as a PWA.

## 13. Build Readiness

Implementation planning is decision-complete for v1.

- External AI is disabled by default.
- External AI is optional only and must require explicit user enablement.
- Core Life OS behavior works without external AI.
- Rule-based System behavior is the v1 default.
- Local-first IndexedDB remains the source of truth.

Everything else can start with the v1 defaults in this blueprint and be tuned after real usage.
