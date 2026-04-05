"use client";

import dynamic from "next/dynamic";

const PropertyDetail = dynamic(
  () =>
    import("@/components/property-detail").then((m) => ({
      default: m.PropertyDetail,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
    ),
  },
);

export function PropertyGate() {
  return <PropertyDetail />;
}
