"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ResolveMatch, ShortlistEntry } from "@/lib/types";
import {
  loadShortlist,
  removeShortlistEntry,
  saveShortlist,
  upsertShortlistEntry,
} from "@/lib/shortlist-storage";

export function ShortlistHome() {
  const router = useRouter();
  const [postcode, setPostcode] = useState("");
  const [huisnummer, setHuisnummer] = useState("");
  const [huisletter, setHuisletter] = useState("");
  const [toevoeging, setToevoeging] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<ResolveMatch[] | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const entries = useMemo(() => {
    void listVersion;
    return loadShortlist();
  }, [listVersion]);

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMatches(null);
    setLoading(true);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode,
          huisnummer,
          huisletter: huisletter || undefined,
          huisnummertoevoeging: toevoeging || undefined,
          woonplaatsnaam: "Amsterdam",
        }),
      });
      const data = (await res.json()) as {
        matches?: ResolveMatch[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Resolve failed");
        return;
      }
      setMatches(data.matches ?? []);
      if (!data.matches?.length) {
        setError("No BAG addresses matched. Try another postcode or number.");
      }
    } catch {
      setError("Network error while resolving the address.");
    } finally {
      setLoading(false);
    }
  }

  function addMatch(m: ResolveMatch) {
    const entry: ShortlistEntry = {
      id: m.verblijfsobjectId,
      addressLabel: m.addressLabel,
      postcode: m.postcode,
      huisnummer: String(m.huisnummer),
      huisletter: huisletter || undefined,
      huisnummertoevoeging: toevoeging || undefined,
      nummeraanduidingId: m.nummeraanduidingId,
      updatedAt: new Date().toISOString(),
    };
    upsertShortlistEntry(entry);
    setMatches(null);
    setPostcode("");
    setHuisnummer("");
    setHuisletter("");
    setToevoeging("");
    setListVersion((v) => v + 1);
    router.push(`/property/${encodeURIComponent(entry.id)}`);
  }

  function remove(id: string) {
    removeShortlistEntry(id);
    setListVersion((v) => v + 1);
  }

  function rename(id: string, nickname: string) {
    const list = loadShortlist();
    const e = list.find((x) => x.id === id);
    if (e) {
      e.nickname = nickname.trim() || undefined;
      e.updatedAt = new Date().toISOString();
      saveShortlist(list);
      setListVersion((v) => v + 1);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Shortlist
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Add an Amsterdam address (postcode + house number). We resolve it via
          the public PDOK Locatieserver (BAG) and store your list only in this
          browser.
        </p>
      </div>

      <form
        onSubmit={handleResolve}
        className="max-w-xl space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Postcode
            <input
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="1012JS"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              autoComplete="postal-code"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            House number
            <input
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="1"
              value={huisnummer}
              onChange={(e) => setHuisnummer(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            House letter (optional)
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="A"
              value={huisletter}
              onChange={(e) => setHuisletter(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Toevoeging (optional)
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="bis"
              value={toevoeging}
              onChange={(e) => setToevoeging(e.target.value)}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Resolving…" : "Resolve address"}
        </button>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </form>

      {matches && matches.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Multiple matches — pick one
          </h2>
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {matches.map((m) => (
              <li
                key={`${m.nummeraanduidingId}-${m.verblijfsobjectId}`}
                className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 dark:bg-zinc-950"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {m.addressLabel}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    VBO {m.verblijfsobjectId} · NA {m.nummeraanduidingId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addMatch(m)}
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Add to shortlist
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Saved properties
        </h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            No saved addresses yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/property/${encodeURIComponent(e.id)}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {e.nickname ? `${e.nickname} — ` : ""}
                    {e.addressLabel}
                  </Link>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">
                    {e.id}
                  </p>
                  <label className="mt-2 flex max-w-md items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="shrink-0">Nickname</span>
                    <input
                      className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                      defaultValue={e.nickname ?? ""}
                      onBlur={(ev) => rename(e.id, ev.target.value)}
                      placeholder="e.g. Canal view"
                    />
                  </label>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/memo/${encodeURIComponent(e.id)}`}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Memo
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
