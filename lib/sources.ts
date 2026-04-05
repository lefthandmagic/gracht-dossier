import type { SectionEnvelope } from "./types";

/** Canonical attribution targets for v1 stubs and live PDOK resolve. */
export const SOURCES = {
  pdokLocatieserver: {
    name: "PDOK Locatieserver (BAG)",
    url: "https://api.pdok.nl/bzk/locatieserver/search/v3_1/ui/",
  },
  bagOgc: {
    name: "PDOK — BAG OGC API (Kadaster)",
    url: "https://api.pdok.nl/kadaster/bag/ogc/v2",
  },
  foundation: {
    name: "Gemeente Amsterdam — Funderingen",
    url: "https://www.amsterdam.nl/",
  },
  heritage: {
    name: "Cultureel erfgoed — Monumentenregister",
    url: "https://monumentenregister.cultureelerfgoed.nl/",
  },
  zoning: {
    name: "DSO / bestemmingsplan (Amsterdam)",
    url: "https://www.amsterdam.nl/bestuur-organisatie/organisatie/ruimte-economie/ruimte-duurzaamheid/",
  },
  energy: {
    name: "EP-Online (RVO)",
    url: "https://www.ep-online.nl/",
  },
  cbs: {
    name: "CBS StatLine",
    url: "https://opendata.cbs.nl/",
  },
} as const;

export function stubSectionEnvelope(
  source: { name: string; url: string },
): SectionEnvelope<null> {
  return {
    status: "empty",
    data: null,
    source: { name: source.name, url: source.url },
    fetchedAt: new Date().toISOString(),
  };
}
