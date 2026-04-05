"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PropertySections } from "@/components/property-sections";
import { SectionCard } from "@/components/section-card";
import { SOURCES } from "@/lib/sources";
import { getShortlistEntry } from "@/lib/shortlist-storage";

export function PropertyDetail() {
  const params = useParams();
  const rawId = params.id;
  const propertyId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [sectionsAttempt, setSectionsAttempt] = useState(0);

  const entry = useMemo(() => {
    if (!propertyId) return null;
    return getShortlistEntry(propertyId) ?? null;
  }, [propertyId]);

  if (!propertyId) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Missing property id.
      </p>
    );
  }

  if (entry === null) {
    return (
      <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-zinc-800 dark:text-zinc-200">
          This property is not in your shortlist on this device. Add it from the
          home page first.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Back to shortlist
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            <Link href="/" className="hover:underline">
              Shortlist
            </Link>
            <span className="mx-2">/</span>
            Property
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {entry.nickname ? `${entry.nickname} — ` : ""}
            {entry.addressLabel}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Last updated locally{" "}
            {new Date(entry.updatedAt).toLocaleString("en-GB")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/memo/${encodeURIComponent(propertyId)}`}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Generate memo
          </Link>
        </div>
      </div>

      <SectionCard title="Overview" envelope={null}>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Address
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {entry.addressLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Postcode / number
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-100">
              {entry.postcode} {entry.huisnummer}
              {entry.huisletter ? entry.huisletter : ""}
              {entry.huisnummertoevoeging
                ? ` ${entry.huisnummertoevoeging}`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Verblijfsobject (BAG)
            </dt>
            <dd className="break-all font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {entry.id}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Nummeraanduiding
            </dt>
            <dd className="break-all font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {entry.nummeraanduidingId ?? "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Resolve source
            </dt>
            <dd>
              <a
                href={SOURCES.pdokLocatieserver.url}
                className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                {SOURCES.pdokLocatieserver.name}
              </a>
            </dd>
          </div>
        </dl>
      </SectionCard>

      <PropertySections
        key={`${propertyId}-${sectionsAttempt}`}
        propertyId={propertyId}
        onRetryAll={() => setSectionsAttempt((a) => a + 1)}
      />
    </div>
  );
}
