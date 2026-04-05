export type SectionStatus = "loaded" | "error" | "empty";

export interface SectionSource {
  name: string;
  url: string;
}

export interface SectionEnvelope<T> {
  status: SectionStatus;
  data: T | null;
  source: SectionSource;
  fetchedAt: string;
  error?: { code: string; message: string };
}

export interface ShortlistEntry {
  /** BAG adresseerbaar object id (verblijfsobject for typical addresses). */
  id: string;
  nickname?: string;
  addressLabel: string;
  postcode: string;
  huisnummer: string;
  huisletter?: string;
  huisnummertoevoeging?: string;
  nummeraanduidingId?: string;
  pandId?: string;
  updatedAt: string;
}

export interface ResolveMatch {
  id: string;
  addressLabel: string;
  nummeraanduidingId: string;
  verblijfsobjectId: string;
  straatnaam: string;
  postcode: string;
  huisnummer: number;
  woonplaatsnaam: string;
}

export interface ResolveRequestBody {
  postcode: string;
  huisnummer: string;
  huisletter?: string;
  huisnummertoevoeging?: string;
  woonplaatsnaam?: string;
}
