"use client";

import { useEffect, useState } from "react";
import { SectionDataRenderer } from "@/components/section-data-renderer";
import { SectionCard } from "@/components/section-card";
import {
  fetchPropertySection,
  PROPERTY_SECTIONS,
  type PropertySectionKey,
} from "@/lib/property-sections-client";
import type { SectionEnvelope } from "@/lib/types";

export function PropertySections({
  propertyId,
  onRetryAll,
}: {
  propertyId: string;
  onRetryAll: () => void;
}) {
  const [sections, setSections] = useState<
    Partial<Record<PropertySectionKey, SectionEnvelope<unknown>>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const results = await Promise.all(
          PROPERTY_SECTIONS.map(async (s) => {
            const env = await fetchPropertySection(propertyId, s.key);
            return [s.key, env] as const;
          }),
        );
        if (cancelled) return;
        const next: Partial<Record<PropertySectionKey, SectionEnvelope<unknown>>> =
          {};
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
      {PROPERTY_SECTIONS.map((s) => {
        const envelope = sections[s.key] ?? null;
        return (
          <SectionCard
            key={s.key}
            title={s.title}
            envelope={envelope}
            onRetry={onRetryAll}
          >
            {envelope?.status === "loaded" && envelope.data != null ? (
              <SectionDataRenderer sectionKey={s.key} data={envelope.data} />
            ) : null}
          </SectionCard>
        );
      })}
    </div>
  );
}
