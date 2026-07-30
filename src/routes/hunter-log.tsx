import { lazy, Suspense } from "react";

const HunterLogView = lazy(() =>
  import("@/features/hunter-log/components/HunterLog").then((module) => ({
    default: module.HunterLogView
  }))
);

export function HunterLogRoute() {
  return (
    <Suspense
      fallback={
        <div className="system-panel mx-auto max-w-7xl p-6 text-sm text-slate-500">
          Loading analytics engine...
        </div>
      }
    >
      <HunterLogView />
    </Suspense>
  );
}
