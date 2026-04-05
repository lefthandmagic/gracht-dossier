"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ShortlistEntry } from "@/lib/types";
import { loadShortlist } from "@/lib/shortlist-storage";

const MAX = 8;

const COLUMNS = [
  "Address",
  "Foundation",
  "Heritage",
  "Zoning",
  "Energy",
  "Area",
] as const;

export function CompareView() {
  const [version, setVersion] = useState(0);
  const entries = useMemo(() => {
    void version;
    return loadShortlist();
  }, [version]);

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setSelected((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const count = Object.values(next).filter(Boolean).length;
      if (count > MAX) {
        return prev;
      }
      return next;
    });
  }

  const picked = entries.filter((e) => selected[e.id]);

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Compare
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Save at least two properties on the shortlist to compare them.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Go to shortlist
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Compare
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Select up to {MAX} saved properties. Section values will populate as we
          wire registers; v1 shows the matrix with placeholders.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Shortlist
        </h2>
        <ul className="mt-3 space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={!!selected[e.id]}
                onChange={() => toggle(e.id)}
                id={`cmp-${e.id}`}
              />
              <label htmlFor={`cmp-${e.id}`} className="text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {e.nickname ? `${e.nickname} — ` : ""}
                  {e.addressLabel}
                </span>
                <span className="block font-mono text-xs text-zinc-500">
                  {e.id}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-4 text-xs text-zinc-500 underline"
          onClick={() => setVersion((v) => v + 1)}
        >
          Refresh list from storage
        </button>
      </div>

      {picked.length < 2 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Select two or more properties to see the comparison table.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                  Property
                </th>
                {COLUMNS.slice(1).map((c) => (
                  <th
                    key={c}
                    className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {picked.map((e: ShortlistEntry) => (
                <tr
                  key={e.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="max-w-xs px-3 py-2 align-top">
                    <Link
                      href={`/property/${encodeURIComponent(e.id)}`}
                      className="font-medium text-emerald-800 hover:underline dark:text-emerald-400"
                    >
                      {e.nickname ? `${e.nickname} — ` : ""}
                      {e.addressLabel}
                    </Link>
                  </td>
                  {COLUMNS.slice(1).map((c) => (
                    <td
                      key={c}
                      className="px-3 py-2 align-top text-zinc-500 dark:text-zinc-500"
                    >
                      —
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
