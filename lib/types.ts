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

export interface FoundationSectionData {
  inAttentionArea: boolean;
  areaLegend: string | null;
  postcode6: string | null;
  municipality: string | null;
  pre1970SharePct: number | null;
  bagCount: number | null;
  summary: string | null;
}

export interface HeritageSectionData {
  monumentCount: number;
  statuses: string[];
  topMonuments: Array<{
    monumentnummer: number | null;
    naam: string | null;
    status: string | null;
    type: string | null;
    datumAanwijzing: string | null;
  }>;
}

export interface ZoningSectionData {
  topSubjects: string[];
  planIds: string[];
  hasAreaDesignations: boolean;
}

export interface EnergySectionData {
  energyClass: string | null;
  validityDate: string | null;
  recordingDate: string | null;
  buildingType: string | null;
  calculationType: string | null;
  sourceRecordId: string | null;
}

export interface AreaSectionData {
  buurtnaam: string | null;
  buurtcode: string | null;
  gemeentenaam: string | null;
  gemeentecode: string | null;
  inwoners: number | null;
  huishoudens: number | null;
  bevolkingsdichtheid: number | null;
  gemiddeldInkomenPerInwoner: number | null;
}
