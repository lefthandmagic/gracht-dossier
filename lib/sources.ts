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
    name: "RVO / PDOK — Indicatieve funderingsaandachtsgebieden",
    url: "https://api.pdok.nl/rvo/indicatieve-aandachtsgebieden-funderingsproblematiek/ogc/v1/",
  },
  heritage: {
    name: "Gemeente Amsterdam — Monumenten",
    url: "https://api.data.amsterdam.nl/v1/monumenten/monumenten",
  },
  zoning: {
    name: "Ruimtelijke plannen (Omgevingswet)",
    url: "https://ruimte.omgevingswet.overheid.nl/ruimtelijke-plannen/api/opvragen/v4/",
  },
  energy: {
    name: "Gemeente Amsterdam — Duurzaamheid energielabel",
    url: "https://api.data.amsterdam.nl/v1/duurzaamheid/energielabel",
  },
  cbs: {
    name: "CBS / PDOK — Wijken en buurten 2022",
    url: "https://api.pdok.nl/cbs/wijken-en-buurten-2022/ogc/v1/",
  },
  valuation: {
    name: "Gracht Dossier — Free valuation model (BAG + open registers)",
    url: "https://github.com/lefthandmagic/gracht-dossier",
  },
  wozApi: {
    name: "WozApi (free tier) — WOZ + BAG endpoint",
    url: "https://woz-api.nl/swagger/index.html",
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
