"use client";

import dynamic from "next/dynamic";

const CompareView = dynamic(
  () =>
    import("@/components/compare-view").then((m) => ({
      default: m.CompareView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Compare
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    ),
  },
);

export function CompareGate() {
  return <CompareView />;
}
