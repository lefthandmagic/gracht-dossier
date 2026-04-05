"use client";

import dynamic from "next/dynamic";

const MemoView = dynamic(
  () =>
    import("@/components/memo-view").then((m) => ({ default: m.MemoView })),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
    ),
  },
);

export function MemoGate() {
  return <MemoView />;
}
