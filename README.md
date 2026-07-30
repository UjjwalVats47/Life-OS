# Life OS

Life OS is a local-first personal growth operating system inspired by Solo Leveling. It turns goals, routines, schedules, habits, events, finance entries, and behavior logs into identity-linked daily quests.

The project is currently a private personal prototype. Core data is stored in the browser through IndexedDB, and external AI is optional rather than required.

## Quick Start

```bash
npm install
npm run dev
```

Open the local app at:

```text
http://127.0.0.1:5173
```

## Useful Commands

```bash
npm run test
npm run build
npm run test:e2e
npm run test:pwa
```

## Folder Structure

```text
Life OS/
  docs/                Product plans, architecture, research, and reference notes
  public/              Static public assets used by the PWA
  src/                 Application source code
    app/               App providers, router setup, and root app wiring
    components/        Reusable UI and layout components
    db/                Dexie/IndexedDB schema, migrations, seed data, repositories
    features/          User-facing product areas and page-level workflows
    lib/               Small shared utilities
    routes/            TanStack Router route files
    stores/            Zustand client state stores
    styles/            Global CSS and visual theme files
    system/            Core Life OS engines and deterministic business logic
    test/              Test setup helpers
    types/             Shared TypeScript domain types
  tests/               Unit, browser, and PWA tests
  package.json         Scripts and dependency list
  vite.config.ts       Vite and PWA build configuration
```

## Main Product Areas

- `src/features/awakening`: onboarding, goals, fixed blocks, commitments, identity selection, and activation.
- `src/features/dashboard`: command center and current protocol summary.
- `src/features/quest-board`: generated quest choices, start/finish/skip behavior, XP updates.
- `src/features/schedule`: time-scale day structure, bounded schedule adaptation, weekly review signals.
- `src/features/goals`: identity hierarchy and goal progress.
- `src/features/habits`: proof habits, redirection, and habit analytics.
- `src/features/hunter-log`: behavioral analytics, explainable insights, and experiments.
- `src/features/settings`: PWA status, reminders, local export/import, AI mode, and work-model rebuild.

## Core Engines

- `src/system/gamification`: XP, ranks, stats, and reset points.
- `src/system/scheduling`: free slots, bounded adaptation, recovery, Sunday catch-up, weekly reviews.
- `src/system/work`: unified work-item model for schedule, quests, habits, events, and analytics.
- `src/system/awakening`: first-week protocol generation.
- `src/system/analytics`: productivity patterns, behavioral commentary, and explainable insights.
- `src/system/identity`: identity option generation and refinement.
- `src/system/ai`: rule-based default plus optional local/external AI adapters.

## Current Status

- V1 app shell, local database, core engines, Awakening, Quest Board, schedule, goals, habits, finance, events, Hunter Log, reminders, chat, export/import, and PWA behavior are implemented.
- V2 behavior-core foundations are started: unified work items, first-week protocol, bounded adaptation, recovery reviews, habit strength, and explainable Hunter Log.
- Phone access from another device still needs separate LAN/hosting setup; the local desktop app uses `127.0.0.1:5173`.

## Privacy Direction

Life OS is local-first. IndexedDB in the user's browser is the source of truth. External AI must stay off by default and must never receive the full personal database automatically.
