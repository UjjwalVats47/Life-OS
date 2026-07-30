import { lazy } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter
} from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { IndexRoute } from "@/routes/index";

const AwakeningRoute = lazy(() =>
  import("@/routes/awakening").then((module) => ({ default: module.AwakeningRoute }))
);
const DashboardRoute = lazy(() =>
  import("@/routes/dashboard").then((module) => ({ default: module.DashboardRoute }))
);
const QuestBoardRoute = lazy(() =>
  import("@/routes/quest-board").then((module) => ({ default: module.QuestBoardRoute }))
);
const ScheduleRoute = lazy(() =>
  import("@/routes/schedule").then((module) => ({ default: module.ScheduleRoute }))
);
const GoalsRoute = lazy(() =>
  import("@/routes/goals").then((module) => ({ default: module.GoalsRoute }))
);
const HabitsRoute = lazy(() =>
  import("@/routes/habits").then((module) => ({ default: module.HabitsRoute }))
);
const HunterLogRoute = lazy(() =>
  import("@/routes/hunter-log").then((module) => ({ default: module.HunterLogRoute }))
);
const FinanceRoute = lazy(() =>
  import("@/routes/finance").then((module) => ({ default: module.FinanceRoute }))
);
const EventsRoute = lazy(() =>
  import("@/routes/events").then((module) => ({ default: module.EventsRoute }))
);
const SettingsRoute = lazy(() =>
  import("@/routes/settings").then((module) => ({ default: module.SettingsRoute }))
);
const SystemChatRoute = lazy(() =>
  import("@/routes/system-chat").then((module) => ({ default: module.SystemChatRoute }))
);

const rootRoute = createRootRoute({
  component: AppShell
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRoute
});

const awakeningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/awakening",
  component: AwakeningRoute
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardRoute
});

const questBoardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/quest-board",
  component: QuestBoardRoute
});

const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schedule",
  component: ScheduleRoute
});

const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/goals",
  component: GoalsRoute
});

const habitsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/habits",
  component: HabitsRoute
});

const hunterLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hunter-log",
  component: HunterLogRoute
});

const financeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/finance",
  component: FinanceRoute
});

const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events",
  component: EventsRoute
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsRoute
});

const systemChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/system-chat",
  component: SystemChatRoute
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  awakeningRoute,
  dashboardRoute,
  questBoardRoute,
  scheduleRoute,
  goalsRoute,
  habitsRoute,
  hunterLogRoute,
  financeRoute,
  eventsRoute,
  settingsRoute,
  systemChatRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
