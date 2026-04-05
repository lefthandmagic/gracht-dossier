"use client";

import dynamic from "next/dynamic";

const ShortlistHome = dynamic(
  () =>
    import("@/components/shortlist-home").then((m) => ({
      default: m.ShortlistHome,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Shortlist
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Loading…
          </p>
        </div>
      </div>
    ),
  },
);

export function ShortlistGate() {
  return <ShortlistHome />;
}
