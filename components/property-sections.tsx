"use client";

import { useEffect, useState } from "react";
import { BagRegisterDetails } from "@/components/bag-register-details";
import { SectionCard } from "@/components/section-card";
import type { BagRegisterPayload } from "@/lib/bag-ogc";
import type { SectionEnvelope } from "@/lib/types";

type SectionKey =
  | "bag"
  | "foundation"
  | "heritage"
  | "zoning"
  | "energy"
  | "area";

const SECTIONS: { key: SectionKey; title: string }[] = [
  { key: "bag", title: "Building (BAG)" },
  { key: "foundation", title: "Foundation" },
  { key: "heritage", title: "Heritage" },
  { key: "zoning", title: "Zoning" },
  { key: "energy", title: "Energy" },
  { key: "area", title: "Area (CBS)" },
];

async function fetchSection(
  propertyId: string,
  key: SectionKey,
): Promise<SectionEnvelope<unknown>> {
  try {
    const res = await fetch(
      `/api/property/${encodeURIComponent(propertyId)}/${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return {
        status: "error",
        data: null,
        source: { name: "App", url: "/" },
        fetchedAt: new Date().toISOString(),
        error: { code: "HTTP", message: `Request failed (${res.status})` },
      };
    }
    return (await res.json()) as SectionEnvelope<unknown>;
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Network error loading this section";
    return {
      status: "error",
      data: null,
      source: { name: "App", url: "/" },
      fetchedAt: new Date().toISOString(),
      error: { code: "FETCH", message },
    };
  }
}

export function PropertySections({
  propertyId,
  onRetryAll,
}: {
  propertyId: string;
  onRetryAll: () => void;
}) {
  const [sections, setSections] = useState<
    Partial<Record<SectionKey, SectionEnvelope<unknown>>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const results = await Promise.all(
          SECTIONS.map(async (s) => {
            const env = await fetchSection(propertyId, s.key);
            return [s.key, env] as const;
          }),
        );
        if (cancelled) return;
        const next: Partial<Record<SectionKey, SectionEnvelope<unknown>>> = {};
        for (const [k, v] of results) next[k] = v;
        setSections(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading register sections…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {SECTIONS.map((s) => {
        const envelope = sections[s.key] ?? null;
        return (
          <SectionCard
            key={s.key}
            title={s.title}
            envelope={envelope}
            onRetry={onRetryAll}
          >
            {envelope?.status === "loaded" &&
            envelope.data != null &&
            s.key === "bag" ? (
              <BagRegisterDetails data={envelope.data as BagRegisterPayload} />
            ) : null}
          </SectionCard>
        );
      })}
    </div>
  );
}
