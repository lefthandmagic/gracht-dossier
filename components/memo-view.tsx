"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildMemoAssessment } from "@/lib/memo-insights";
import {
  fetchPropertySection,
  PROPERTY_SECTIONS,
  type PropertySectionKey,
} from "@/lib/property-sections-client";
import { SOURCES } from "@/lib/sources";
import { getShortlistEntry } from "@/lib/shortlist-storage";
import type { SectionEnvelope } from "@/lib/types";

export function MemoView() {
  const params = useParams();
  const rawId = params.id;
  const propertyId = Array.isArray(rawId) ? rawId[0] : rawId;

  const entry = useMemo(() => {
    if (!propertyId) return null;
    return getShortlistEntry(propertyId) ?? null;
  }, [propertyId]);

  const [sections, setSections] = useState<
    Partial<Record<PropertySectionKey, SectionEnvelope<unknown>>>
  >({});
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (!propertyId || entry == null) return;
    let cancelled = false;
    setLoadingInsights(true);
    setSections({});
    (async () => {
      try {
        const results = await Promise.all(
          PROPERTY_SECTIONS.map(async (section) => {
            const env = await fetchPropertySection(propertyId, section.key);
            return [section.key, env] as const;
          }),
        );
        if (cancelled) return;
        const next: Partial<Record<PropertySectionKey, SectionEnvelope<unknown>>> =
          {};
        for (const [key, env] of results) {
          next[key] = env;
        }
        setSections(next);
      } finally {
        if (!cancelled) setLoadingInsights(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entry, propertyId]);

  const assessment = useMemo(() => buildMemoAssessment(sections), [sections]);

  if (!propertyId) {
    return <p className="text-sm text-zinc-600">Missing property id.</p>;
  }

  if (entry === null) {
    return (
      <div className="space-y-4">
        <p>Property not in shortlist on this device.</p>
        <Link href="/" className="text-emerald-800 underline dark:text-emerald-400">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <article className="memo-print space-y-8 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-300 pb-6 dark:border-zinc-700">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Investment memo (draft)
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {entry.nickname ? `${entry.nickname} — ` : ""}
          {entry.addressLabel}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Verblijfsobject {entry.id} · Nummeraanduiding{" "}
          {entry.nummeraanduidingId ?? "—"}
        </p>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          Informational only: not structural, legal, or investment advice.
          Verify all facts with the original registers.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold">Executive summary</h2>
        <div className="mt-3 space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Buyer verdict:{" "}
            <span
              className={[
                "rounded px-2 py-1 text-xs font-semibold",
                assessment.verdict === "High attention"
                  ? "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100"
                  : assessment.verdict === "Proceed with conditions"
                    ? "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100"
                    : "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100",
              ].join(" ")}
            >
              {assessment.verdict}
            </span>
          </p>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {assessment.verdictReason}
          </p>
          {loadingInsights ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Building decision signals from register sections…
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Top register signals</h2>
        {assessment.risks.length ? (
          <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            {assessment.risks.map((risk, index) => (
              <li
                key={`${risk.title}-${index}`}
                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  [{risk.severity.toUpperCase()}] {risk.title}
                </p>
                <p className="mt-1">{risk.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            No high-impact signals were detected from the currently loaded register data.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Actions before bidding</h2>
        {assessment.actions.length ? (
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {assessment.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            No extra actions suggested from loaded sections.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Missing or weak data</h2>
        {assessment.missingData.length ? (
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {assessment.missingData.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            No missing-data warnings from loaded sections.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Address &amp; identifiers</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
          <li>Display: {entry.addressLabel}</li>
          <li>Postcode / number: {entry.postcode} {entry.huisnummer}</li>
          <li>BAG verblijfsobject: {entry.id}</li>
          <li>BAG nummeraanduiding: {entry.nummeraanduidingId ?? "—"}</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Data provenance</h2>
        <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <a href={SOURCES.pdokLocatieserver.url}>{SOURCES.pdokLocatieserver.name}</a>
          </li>
          <li>
            <a href={SOURCES.foundation.url}>{SOURCES.foundation.name}</a>
          </li>
          <li>
            <a href={SOURCES.heritage.url}>{SOURCES.heritage.name}</a>
          </li>
          <li>
            <a href={SOURCES.zoning.url}>{SOURCES.zoning.name}</a>
          </li>
          <li>
            <a href={SOURCES.energy.url}>{SOURCES.energy.name}</a>
          </li>
          <li>
            <a href={SOURCES.wozApi.url}>{SOURCES.wozApi.name}</a>
          </li>
          <li>
            <a href={SOURCES.cbs.url}>{SOURCES.cbs.name}</a>
          </li>
          <li>
            <a href={SOURCES.valuation.url}>{SOURCES.valuation.name}</a>
          </li>
        </ul>
      </section>

      <footer className="border-t border-zinc-300 pt-6 text-xs text-zinc-500 dark:border-zinc-700">
        Generated from Gracht Dossier · Local browser shortlist only ·{" "}
        {new Date().toISOString()}
      </footer>

      <p className="print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Print or Save as PDF
        </button>
        <Link
          href={`/property/${encodeURIComponent(propertyId)}`}
          className="ml-3 text-sm text-emerald-800 underline dark:text-emerald-400"
        >
          Back to property
        </Link>
      </p>
    </article>
  );
}
