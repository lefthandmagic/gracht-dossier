import { buildMemoAssessment } from "@/lib/memo-insights";
import type { BagRegisterPayload } from "@/lib/bag-ogc";
import type {
  EnergySectionData,
  FoundationSectionData,
  SectionEnvelope,
  ZoningSectionData,
} from "@/lib/types";

function loaded<T>(data: T): SectionEnvelope<T> {
  return {
    status: "loaded",
    data,
    source: { name: "Test", url: "https://example.com" },
    fetchedAt: "2026-04-05T20:00:00.000Z",
  };
}

describe("buildMemoAssessment", () => {
  it("flags high attention when multiple high-risk signals exist", () => {
    const bag: BagRegisterPayload = {
      verblijfsobjectId: "x",
      hoofdadresId: "y",
      openbareRuimteNaam: "Keizersgracht",
      postcode: "1015CE",
      huisnummer: 57,
      gebruiksdoel: "woonfunctie",
      oppervlakteM2: 130,
      vboStatus: "Verblijfsobject in gebruik",
      woonplaatsNaam: "Amsterdam",
      pandBouwjaar: 1978,
      pandId: "p1",
      pandStatus: "Pand in gebruik",
      documentdatum: "2020-03-06",
      rdfSeeAlsoVbo: null,
      coordinates: { lon: 4.88, lat: 52.37 },
    };
    const foundation: FoundationSectionData = {
      inAttentionArea: true,
      areaLegend: "Stedelijk gebied - 80-100 %",
      postcode6: "1015CD",
      municipality: "Amsterdam",
      pre1970SharePct: 92.8,
      bagCount: 14,
      summary: null,
    };
    const energy: EnergySectionData = {
      energyClass: "G",
      validityDate: "2030-03-05",
      recordingDate: "2020-03-17",
      buildingType: "Maisonnette",
      calculationType: "NTA8800",
      sourceRecordId: "e1",
    };
    const zoning: ZoningSectionData = {
      topSubjects: ["Waarde - Cultuurhistorie"],
      planIds: ["NL.IMRO.0363.XYZ"],
      hasAreaDesignations: true,
    };

    const result = buildMemoAssessment({
      bag: loaded(bag),
      foundation: loaded(foundation),
      energy: loaded(energy),
      zoning: loaded(zoning),
    });

    expect(result.verdict).toBe("High attention");
    expect(result.risks.some((r) => r.title.includes("Energy class"))).toBe(true);
    expect(result.risks.some((r) => r.title.includes("Foundation attention"))).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("adds missing-data guidance for empty/error sections", () => {
    const result = buildMemoAssessment({
      energy: {
        status: "empty",
        data: null,
        source: { name: "Energy", url: "https://example.com" },
        fetchedAt: "2026-04-05T20:00:00.000Z",
      },
      zoning: {
        status: "error",
        data: null,
        source: { name: "Zoning", url: "https://example.com" },
        fetchedAt: "2026-04-05T20:00:00.000Z",
        error: { code: "UPSTREAM", message: "Request failed (500)" },
      },
    });

    expect(result.missingData.some((item) => item.includes("energy"))).toBe(true);
    expect(result.missingData.some((item) => item.includes("zoning"))).toBe(true);
    expect(
      result.actions.some((action) => action.includes("Resolve missing/error sections")),
    ).toBe(true);
  });
});
