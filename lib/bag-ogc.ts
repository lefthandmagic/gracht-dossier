const OGC_BASE = "https://api.pdok.nl/kadaster/bag/ogc/v2";

export interface BagRegisterPayload {
  verblijfsobjectId: string;
  hoofdadresId: string | null;
  openbareRuimteNaam: string | null;
  postcode: string | null;
  huisnummer: number | null;
  gebruiksdoel: string | null;
  oppervlakteM2: number | null;
  vboStatus: string | null;
  woonplaatsNaam: string | null;
  pandBouwjaar: number | null;
  pandId: string | null;
  pandStatus: string | null;
  documentdatum: string | null;
  rdfSeeAlsoVbo: string | null;
  coordinates: { lon: number; lat: number } | null;
}

interface FeatureCollection {
  features?: Array<{
    properties?: Record<string, unknown>;
    geometry?: {
      type?: string;
      coordinates?: unknown;
    };
  }>;
}

interface Feature {
  properties?: Record<string, unknown>;
}

function pickString(props: Record<string, unknown>, key: string): string | null {
  const v = props[key];
  if (v == null) return null;
  if (typeof v === "string") return v;
  return String(v);
}

function pickNumber(props: Record<string, unknown>, key: string): number | null {
  const v = props[key];
  if (v == null) return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function pickHrefArray(props: Record<string, unknown>, key: string): string[] {
  const v = props[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export async function fetchBagRegister(
  verblijfsobjectIdentificatie: string,
): Promise<BagRegisterPayload | null> {
  const listUrl = new URL(
    `${OGC_BASE}/collections/verblijfsobject/items`,
  );
  listUrl.searchParams.set("identificatie", verblijfsobjectIdentificatie);
  listUrl.searchParams.set("f", "json");
  listUrl.searchParams.set("limit", "1");

  const vboRes = await fetch(listUrl.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });

  if (!vboRes.ok) {
    throw new Error(`BAG OGC verblijfsobject: HTTP ${vboRes.status}`);
  }

  const vboJson = (await vboRes.json()) as FeatureCollection;
  const feature = vboJson.features?.[0];
  const props = feature?.properties;
  if (!props) return null;
  const coords =
    feature?.geometry?.type === "Point" && Array.isArray(feature.geometry.coordinates)
      ? feature.geometry.coordinates
      : null;
  const lon = typeof coords?.[0] === "number" ? coords[0] : null;
  const lat = typeof coords?.[1] === "number" ? coords[1] : null;

  const pandHrefs = pickHrefArray(props, "pand.href");
  let pandBouwjaar: number | null = null;
  let pandId: string | null = null;
  let pandStatus: string | null = null;

  const firstPandUrl = pandHrefs[0];
  if (firstPandUrl) {
    const pandUrl = new URL(firstPandUrl);
    pandUrl.searchParams.set("f", "json");
    const pandRes = await fetch(pandUrl.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (pandRes.ok) {
      const pandJson = (await pandRes.json()) as Feature;
      const pp = pandJson.properties;
      if (pp) {
        pandBouwjaar = pickNumber(pp, "bouwjaar");
        pandId = pickString(pp, "identificatie");
        pandStatus = pickString(pp, "status");
      }
    }
  }

  return {
    verblijfsobjectId: pickString(props, "identificatie") ?? verblijfsobjectIdentificatie,
    hoofdadresId: pickString(props, "hoofdadres_identificatie"),
    openbareRuimteNaam: pickString(props, "openbare_ruimte_naam"),
    postcode: pickString(props, "postcode"),
    huisnummer: pickNumber(props, "huisnummer"),
    gebruiksdoel: pickString(props, "gebruiksdoel"),
    oppervlakteM2: pickNumber(props, "oppervlakte"),
    vboStatus: pickString(props, "status"),
    woonplaatsNaam: pickString(props, "woonplaats_naam"),
    pandBouwjaar,
    pandId,
    pandStatus,
    documentdatum: pickString(props, "documentdatum"),
    rdfSeeAlsoVbo: pickString(props, "rdf_seealso"),
    coordinates: lon != null && lat != null ? { lon, lat } : null,
  };
}
