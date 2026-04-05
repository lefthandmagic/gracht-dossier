import {
  getShortlistEntry,
  loadShortlist,
  removeShortlistEntry,
  updateShortlistNickname,
  upsertShortlistEntry,
} from "@/lib/shortlist-storage";
import type { ShortlistEntry } from "@/lib/types";

const KEY = "gracht-dossier.shortlist.v1";

function sampleEntry(overrides: Partial<ShortlistEntry> = {}): ShortlistEntry {
  return {
    id: "0363010003761571",
    addressLabel: "Dam 1, 1012JS Amsterdam",
    postcode: "1012JS",
    huisnummer: "1",
    nummeraanduidingId: "0363200003761447",
    updatedAt: "2026-04-05T10:00:00.000Z",
    ...overrides,
  };
}

describe("shortlist-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty list when storage is empty", () => {
    expect(loadShortlist()).toEqual([]);
  });

  it("upserts and retrieves shortlist entries", () => {
    const entry = sampleEntry();
    upsertShortlistEntry(entry);

    const list = loadShortlist();
    expect(list).toHaveLength(1);
    expect(getShortlistEntry(entry.id)?.addressLabel).toBe(entry.addressLabel);
  });

  it("replaces an existing entry with same id", () => {
    const entry = sampleEntry();
    upsertShortlistEntry(entry);

    upsertShortlistEntry(sampleEntry({ nickname: "Canal view" }));

    const list = loadShortlist();
    expect(list).toHaveLength(1);
    expect(list[0].nickname).toBe("Canal view");
  });

  it("updates nickname and removes entry", () => {
    const entry = sampleEntry();
    upsertShortlistEntry(entry);

    updateShortlistNickname(entry.id, "  Test Label  ");
    expect(getShortlistEntry(entry.id)?.nickname).toBe("Test Label");

    removeShortlistEntry(entry.id);
    expect(loadShortlist()).toEqual([]);
  });

  it("returns empty list for invalid JSON", () => {
    localStorage.setItem(KEY, "{not-json");
    expect(loadShortlist()).toEqual([]);
  });
});
