/** @jest-environment node */
import { GET } from "@/app/api/property/[id]/valuation/route";

jest.mock("@/lib/bag-ogc", () => ({
  fetchBagRegister: jest.fn(),
}));

const { fetchBagRegister } = jest.requireMock("@/lib/bag-ogc") as {
  fetchBagRegister: jest.Mock;
};

describe("GET /api/property/[id]/valuation", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    fetchBagRegister.mockReset();
    delete process.env.WOZ_API_KEY;
  });

  it("returns valuation estimate from free register signals", async () => {
    fetchBagRegister.mockResolvedValue({
      verblijfsobjectId: "0363010000700452",
      hoofdadresId: "0363200000161769",
      openbareRuimteNaam: "Keizersgracht",
      postcode: "1015CE",
      huisnummer: 57,
      gebruiksdoel: "woonfunctie",
      oppervlakteM2: 130,
      vboStatus: "Verblijfsobject in gebruik",
      woonplaatsNaam: "Amsterdam",
      pandBouwjaar: 1978,
      pandId: "0363100012169216",
      pandStatus: "Pand in gebruik",
      documentdatum: "2020-03-06",
      rdfSeeAlsoVbo: null,
      coordinates: { lon: 4.885, lat: 52.375 },
    });

    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const rawUrl = typeof input === "string" ? input : input.toString();
      if (rawUrl.includes("/area")) {
        return {
          ok: true,
          json: async () => ({
            status: "loaded",
            data: {
              gemeentenaam: "Amsterdam",
              gemiddeldInkomenPerInwoner: 48000,
            },
          }),
        } as Response;
      }
      if (rawUrl.includes("/energy")) {
        return {
          ok: true,
          json: async () => ({
            status: "loaded",
            data: { energyClass: "B" },
          }),
        } as Response;
      }
      if (rawUrl.includes("/foundation")) {
        return {
          ok: true,
          json: async () => ({
            status: "loaded",
            data: { inAttentionArea: true },
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    }) as unknown as typeof fetch;

    const response = await GET(
      new Request("http://localhost/api/property/0363010000700452/valuation"),
      { params: Promise.resolve({ id: "0363010000700452" }) },
    );
    const body = await response.json();

    expect(body.status).toBe("loaded");
    expect(body.data.estimateEur.mid).toBeGreaterThan(0);
    expect(body.data.confidence).toBe("medium");
    expect(body.data.drivers.join(" ")).toContain("Energy class B");
  });

  it("blends WOZ value when WozApi returns data", async () => {
    process.env.WOZ_API_KEY = "demo-key";
    fetchBagRegister.mockResolvedValue({
      verblijfsobjectId: "0363010000700452",
      hoofdadresId: "0363200000161769",
      openbareRuimteNaam: "Keizersgracht",
      postcode: "1015CE",
      huisnummer: 57,
      gebruiksdoel: "woonfunctie",
      oppervlakteM2: 130,
      vboStatus: "Verblijfsobject in gebruik",
      woonplaatsNaam: "Amsterdam",
      pandBouwjaar: 1978,
      pandId: "0363100012169216",
      pandStatus: "Pand in gebruik",
      documentdatum: "2020-03-06",
      rdfSeeAlsoVbo: null,
      coordinates: { lon: 4.885, lat: 52.375 },
    });

    global.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const rawUrl = typeof input === "string" ? input : input.toString();
      if (rawUrl.includes("woz-api.nl/Api/AdresseerbaarObject/")) {
        return {
          ok: true,
          json: async () => ({
            woz: [
              { peildatum: "2024-01-01", vastgesteldeWaarde: 980000 },
              { peildatum: "2023-01-01", vastgesteldeWaarde: 920000 },
            ],
          }),
        } as Response;
      }
      if (rawUrl.includes("/area")) {
        return {
          ok: true,
          json: async () => ({
            status: "loaded",
            data: {
              gemeentenaam: "Amsterdam",
              gemiddeldInkomenPerInwoner: 48000,
            },
          }),
        } as Response;
      }
      if (rawUrl.includes("/energy")) {
        return {
          ok: true,
          json: async () => ({
            status: "loaded",
            data: { energyClass: "A" },
          }),
        } as Response;
      }
      if (rawUrl.includes("/foundation")) {
        return {
          ok: true,
          json: async () => ({
            status: "loaded",
            data: { inAttentionArea: false },
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    }) as unknown as typeof fetch;

    const response = await GET(
      new Request("http://localhost/api/property/0363010000700452/valuation"),
      { params: Promise.resolve({ id: "0363010000700452" }) },
    );
    const body = await response.json();

    expect(body.status).toBe("loaded");
    expect(body.data.wozValueEur).toBe(980000);
    expect(body.data.wozReferenceDate).toBe("2024-01-01");
    expect(body.data.confidence).toBe("high");
  });

  it("returns empty when BAG record is unavailable", async () => {
    fetchBagRegister.mockResolvedValue(null);
    const response = await GET(
      new Request("http://localhost/api/property/0363010000700452/valuation"),
      { params: Promise.resolve({ id: "0363010000700452" }) },
    );
    const body = await response.json();
    expect(body.status).toBe("empty");
  });
});
