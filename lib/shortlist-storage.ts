import type { ShortlistEntry } from "./types";

const STORAGE_KEY = "gracht-dossier.shortlist.v1";

export function loadShortlist(): ShortlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ShortlistEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveShortlist(entries: ShortlistEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function upsertShortlistEntry(entry: ShortlistEntry): void {
  const list = loadShortlist();
  const i = list.findIndex((e) => e.id === entry.id);
  if (i >= 0) list[i] = entry;
  else list.push(entry);
  saveShortlist(list);
}

export function removeShortlistEntry(id: string): void {
  saveShortlist(loadShortlist().filter((e) => e.id !== id));
}

export function updateShortlistNickname(id: string, nickname: string): void {
  const list = loadShortlist();
  const e = list.find((x) => x.id === id);
  if (e) {
    e.nickname = nickname.trim() || undefined;
    e.updatedAt = new Date().toISOString();
    saveShortlist(list);
  }
}

export function getShortlistEntry(id: string): ShortlistEntry | undefined {
  return loadShortlist().find((e) => e.id === id);
}
