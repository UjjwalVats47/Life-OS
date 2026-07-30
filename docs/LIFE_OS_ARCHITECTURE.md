# The System: Life OS - Architecture Diagram

This document shows the planned v1 architecture for Life OS. It is based on:

- `LIFE_OS_CONCEPT.md`
- `LIFE_OS_V1_BLUEPRINT.md`
- `LIFE_OS_IMPLEMENTATION_PLAN.md`

## 1. High-Level Architecture

```mermaid
flowchart TD
  User["User"] --> PWA["Life OS PWA<br/>React + TypeScript + Vite"]

  PWA --> Routes["TanStack Router<br/>App Screens"]
  PWA --> UIState["Zustand<br/>Temporary UI State"]
  PWA --> Forms["React Hook Form + Zod<br/>Forms + Validation"]
  PWA --> PwaLayer["PWA Layer<br/>Manifest + Service Worker"]

  Routes --> Awakening["The Awakening"]
  Routes --> Dashboard["Command Center"]
  Routes --> QuestBoard["Quest Board"]
  Routes --> Schedule["Schedule"]
  Routes --> Goals["Goals + Identity"]
  Routes --> Habits["Habits + Redirection"]
  Routes --> HunterLog["Hunter's Log"]
  Routes --> Finance["Finance"]
  Routes --> Events["Events + Deadlines"]
  Routes --> Settings["Settings"]

  Awakening --> SystemLayer["System Engines"]
  Dashboard --> SystemLayer
  QuestBoard --> SystemLayer
  Schedule --> SystemLayer
  Goals --> SystemLayer
  Habits --> SystemLayer
  HunterLog --> SystemLayer
  Finance --> SystemLayer
  Events --> SystemLayer

  SystemLayer --> IdentityEngine["Identity Engine"]
  SystemLayer --> SchedulingEngine["Scheduling Engine"]
  SystemLayer --> TaskEngine["Task Generation + Escalation"]
  SystemLayer --> HabitEngine["Habit + Redirection Engine"]
  SystemLayer --> GamificationEngine["XP + Rank + Stats + Reset Points"]
  SystemLayer --> AnalyticsEngine["Behavioral Analytics Engine"]
  SystemLayer --> ReminderEngine["Reminder Engine"]
  SystemLayer --> AiLayer["AI Adapter Layer"]

  IdentityEngine --> Repos["Repository Layer"]
  SchedulingEngine --> Repos
  TaskEngine --> Repos
  HabitEngine --> Repos
  GamificationEngine --> Repos
  AnalyticsEngine --> Repos
  ReminderEngine --> Repos
  AiLayer --> Repos

  Repos --> Dexie["Dexie.js"]
  Dexie --> IndexedDB["IndexedDB<br/>Local-First Database"]

  HunterLog --> Charts["Apache ECharts<br/>Analytics + Heatmaps"]
  Charts --> AnalyticsEngine

  PwaLayer --> Cache["Offline App Shell Cache"]
  ReminderEngine --> Notifications["Browser/PWA Notifications<br/>where supported"]

  AiLayer --> RuleAI["Rule-Based Local System"]
  AiLayer --> LocalAI["Optional Local AI<br/>Ollama/WebLLM/Transformers.js"]
  AiLayer --> ExternalAI["Optional External AI<br/>Explicit User Approval"]

  ExternalAI -. "private context may leave device" .-> Cloud["External AI Provider"]
```

## 2. Data Flow

```mermaid
flowchart LR
  A["The Awakening Input"] --> B["Validation<br/>Zod"]
  B --> C["System Analysis"]
  C --> D["Identity Options"]
  D --> E["User Direction"]
  E --> F["Refined Identity"]
  F --> G["Initial Protocol"]

  G --> H["Goals"]
  G --> I["Habits"]
  G --> J["Schedule Blocks"]
  G --> K["Commitments"]
  G --> L["Task Templates"]
  G --> M["Events"]

  H --> DB["IndexedDB via Dexie"]
  I --> DB
  J --> DB
  K --> DB
  L --> DB
  M --> DB

  DB --> N["Daily Quest Board"]
  N --> O["Two Best-Suited Options"]
  O --> P["Task Attempt"]
  P --> Q["XP / Stats / Rank / Reset Points"]
  P --> R["Behavior Evidence"]
  P --> S["Mood / Stress / Reflection"]
  P --> T["Finance / Event Links"]

  Q --> DB
  R --> DB
  S --> DB
  T --> DB

  DB --> U["Hunter's Log"]
  U --> V["Patterns + Insights"]
  V --> W["Future Scheduling Adjustments"]
  W --> N
```

## 3. Local-First Privacy Boundary

```mermaid
flowchart TD
  subgraph Device["User Device"]
    App["Life OS PWA"]
    LocalDb["IndexedDB Local Database"]
    RuleCore["Rule-Based System Engines"]
    LocalModel["Optional Local AI"]
    Export["JSON Export / Backup"]
  end

  App --> LocalDb
  App --> RuleCore
  RuleCore --> LocalDb
  App --> LocalModel
  LocalDb --> Export

  App -. "optional, explicit only" .-> ExternalAI["External AI API"]
  ExternalAI -. "response" .-> App

  LocalDb -. "not synced by default" .-x CloudDb["Cloud Database"]
```

## 4. Main Engine Responsibilities

```mermaid
flowchart TD
  System["System Engines"] --> Identity["Identity Engine<br/>Generate identity options<br/>Refine with user direction"]
  System --> Schedule["Scheduling Engine<br/>Detect free blocks<br/>Manage commitments<br/>Sunday catch-up"]
  System --> Tasks["Task Engine<br/>Two options per slot<br/>Escalation phases<br/>Phase 3 rules"]
  System --> Habits["Habit Engine<br/>Proof habits<br/>Target habits<br/>Redirection"]
  System --> Game["Gamification Engine<br/>XP<br/>Stats<br/>Ranks<br/>Reset points"]
  System --> Analytics["Analytics Engine<br/>Productivity rhythm<br/>Mood/stress<br/>Schedule realism"]
  System --> Reminders["Reminder Engine<br/>Task starts<br/>Deadlines<br/>Weekly review"]
  System --> Chat["AI/Chat Adapter<br/>Cold Architect<br/>Strategic Mentor<br/>Shadow Guard"]
```

## 5. First-Build Architecture Notes

- The app is local-first: sensitive data stays in IndexedDB by default.
- The PWA layer makes Life OS installable and caches the app shell.
- System engines should be pure TypeScript where possible so they are easy to test.
- UI screens should call repositories and engines, not contain business rules directly.
- External AI is optional and explicit. Core scheduling, XP, rank, reset points, and Phase 3 rules must work without external AI.
- Hunter's Log should read from behavioral evidence, task attempts, mood/stress entries, finance entries, and schedule history.

