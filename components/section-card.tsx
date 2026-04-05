"use client";

import type { SectionEnvelope } from "@/lib/types";

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function SectionCard({
  title,
  envelope,
  onRetry,
  children,
}: {
  title: string;
  envelope: SectionEnvelope<unknown> | null;
  onRetry?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Retry
          </button>
        ) : null}
      </div>

      {!envelope ? (
        <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {children}
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Source:{" "}
            <a
              href={envelope.source.url}
              className="font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              {envelope.source.name}
            </a>
            {" · "}
            Fetched {formatTime(envelope.fetchedAt)}
          </p>

          {envelope.status === "error" ? (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-200">
              {envelope.error?.message ?? "Something went wrong loading this section."}
            </div>
          ) : null}

          {envelope.status === "empty" ? (
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              No row from this register for this object, or this integration is
              not connected yet (still pending: foundation, heritage, zoning,
              energy, CBS).
            </div>
          ) : null}

          {envelope.status === "loaded" && envelope.data != null ? (
            <div className="mt-3 text-sm text-zinc-800 dark:text-zinc-200">
              {children}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
