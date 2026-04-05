import type { ResolveMatch } from "./types";

const FREE =
  "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free" as const;

interface PdokDoc {
  weergavenaam?: string;
  nummeraanduiding_id?: string;
  adresseerbaarobject_id?: string;
  straatnaam?: string;
  postcode?: string;
  huisnummer?: number;
  woonplaatsnaam?: string;
}

interface PdokFreeResponse {
  response?: {
    docs?: PdokDoc[];
  };
}

export async function searchBagAddresses(params: {
  postcode: string;
  huisnummer: string;
  huisletter?: string;
  huisnummertoevoeging?: string;
  woonplaatsnaam?: string;
  rows?: number;
}): Promise<ResolveMatch[]> {
  const pc = params.postcode.replace(/\s/g, "").toUpperCase();
  const hn = params.huisnummer.trim();
  if (!pc || !hn) return [];

  let q = `postcode:${pc} AND huisnummer:${hn} AND type:adres`;
  if (params.huisletter?.trim()) {
    q += ` AND huisletter:${params.huisletter.trim().toUpperCase()}`;
  }
  if (params.huisnummertoevoeging?.trim()) {
    q += ` AND huisnummertoevoeging:${params.huisnummertoevoeging.trim()}`;
  }
  if (params.woonplaatsnaam?.trim()) {
    q += ` AND woonplaatsnaam:${params.woonplaatsnaam.trim()}`;
  }

  const url = new URL(FREE);
  url.searchParams.set("q", q);
  url.searchParams.set("rows", String(params.rows ?? 15));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`PDOK Locatieserver error: ${res.status}`);
  }

  const json = (await res.json()) as PdokFreeResponse;
  const docs = json.response?.docs ?? [];

  const matches: ResolveMatch[] = [];
  for (const doc of docs) {
    const vbo = doc.adresseerbaarobject_id;
    const naid = doc.nummeraanduiding_id;
    if (!vbo || !naid) continue;
    matches.push({
      id: vbo,
      verblijfsobjectId: vbo,
      nummeraanduidingId: naid,
      addressLabel: doc.weergavenaam ?? `${doc.straatnaam ?? ""} ${hn}, ${pc}`,
      straatnaam: doc.straatnaam ?? "",
      postcode: doc.postcode ?? pc,
      huisnummer: doc.huisnummer ?? Number(hn),
      woonplaatsnaam: doc.woonplaatsnaam ?? "",
    });
  }
  return matches;
}
