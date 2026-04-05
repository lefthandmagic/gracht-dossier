# Product specification — v1

**Working title:** Amsterdam canal-home buyer intelligence (internal codename TBD)  
**Repository root:** `ClosetOrganizer/`  
**Document status:** v1 scope lock for initial build  
**Last updated:** 2026-04-05

---

## 1. Problem statement

People buying high-value homes in Amsterdam—especially **canal belt (grachtengordel) stock**—need **official, address-level** signals (foundations, monument status, zoning, energy performance, neighborhood context) in one place. Listing sites and brokers rarely surface this consistently. Buyers waste time tabbing between **Gemeente Amsterdam**, **PDOK**, **CBS**, and **EP-Online**, and still miss **cross-property comparison** and a **shareable brief**.

## 2. Target user (v1)

- **Primary:** Serious purchaser (or small circle: buyer + partner + advisor) comparing a **short list** of addresses in Amsterdam.
- **Not primary in v1:** Agents, banks, or the general rental market.

## 3. Product goals (v1)

1. **Resolve** a Dutch address to a stable building object where the upstream registers allow it.
2. **Surface** key due-diligence dimensions per property with **clear data provenance** (source links / attribution).
3. **Compare** multiple saved properties side-by-side on the same dimensions.
4. **Produce** a **print-friendly investment memo** (browser print / Save as PDF) for a single property—no separate paywall in v1.

## 4. Out of scope (v1)

- Native iOS/Android apps (responsive web only; PWA optional later).
- User accounts, cloud sync, or multi-device shortlists (client-side persistence only).
- Scraping or integrating **listing portals** (e.g. Funda) as a data source.
- Legal, tax, notary, or structural **advice**; the product is **informational** only.
- Guaranteed completeness: some registers have **gaps**; UI must show **unknown / unavailable** explicitly.

## 5. Core user flows

### 5.1 Shortlist

1. User adds a property by **postcode + house number** (+ optional suffix) or by **map pin** (if implemented in v1).
2. If multiple units match, user **disambiguates** (e.g. A/B, rear house).
3. App fetches and displays a **property overview** with section status (loaded / error / empty).
4. User saves to **shortlist** (local persistence). User can **remove** or **rename** (nickname) entries.

### 5.2 Property detail

Single-property view with sections (tabs or stacked):

| Section        | Intent |
|----------------|--------|
| Overview       | Map (if present), key chips, address/BAG identifiers, last sync time |
| Foundation     | Amsterdam **Funderingen** (where available) |
| Heritage       | **Monumenten** + **Kwaliteitsmonitor**-linked monument / beschermd stadsgezicht |
| Zoning         | **Bestemmingsplan** summary for the location (DSO / Amsterdam APIs as available) |
| Energy         | **EP-Online** / registered label (or explicit “no label found”) |
| Area           | Short **CBS** neighborhood snapshot (OData), not valuation |

Each section: **source**, **timestamp**, **retry** on failure.

### 5.3 Compare

1. User selects **two or more** properties from the shortlist (suggested comfortable maximum: **8**).
2. Table compares the **same columns** as the detail sections (foundation class, monument flags, stadsgezicht, energy label, zoning one-liner, etc.).
3. Optional: **highlight differences** (hide or de-emphasize identical cells).
4. Tapping a cell opens a **sheet** with snippet + link to full property.

### 5.4 Investment memo

1. From property detail, user opens **Generate memo** (optional toggles: include/exclude sections; **Executive** vs **Technical** verbosity).
2. App renders a **long, print-optimized** page (same facts as detail, narrative summary on top).
3. User uses **Print → Save as PDF** (v1). Server-generated PDF is **post-v1** unless trivial to add.

## 6. Data & compliance

- **Server-side only** for keys and proxy calls (no secrets in the browser).
- **Amsterdam Datapunt:** API key via environment variable; respect terms and rate limits.
- **PDOK / BAG:** public services; proxy for CORS and caching.
- **CBS StatLine OData:** open data; attribute CBS clearly.
- **EP-Online:** use public or registered interfaces per current RVO rules; attribute source.

Disclaimer on every memo and footer: **not structural, legal, or investment advice**.

## 7. Technical stack (agreed direction)

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Route Handlers** for upstream APIs
- **Shortlist** in **localStorage** or **IndexedDB**
- **Hosting:** **Vercel** Hobby (free `*.vercel.app` until custom domain)
- **Language (UI):** English first; Dutch copy can follow

## 8. Success criteria (v1 “done”)

- [ ] Add + disambiguate + save at least one Amsterdam canal-zone address end-to-end.
- [ ] At least **one** section fully wired (recommended first: **Foundation** or **PDOK/BAG resolve**).
- [ ] Remaining sections wired or explicitly **stubbed** with “data unavailable” and provenance.
- [ ] Compare works for 2+ saved properties.
- [ ] Memo page prints cleanly to PDF from Chrome/Safari.
- [ ] README documents **env vars** and **local run** steps.

## 9. Open decisions (post-spec)

- Map in v1 vs v2 (MapLibre + PDOK tiles vs no map).
- Optional UI kit (e.g. shadcn/ui).
- Server-side PDF library vs print-only for v1.1.

---

*This spec is the scope contract for v1 implementation.*
