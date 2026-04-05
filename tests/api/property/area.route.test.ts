/** @jest-environment node */
import { GET } from "@/app/api/property/[id]/area/route";

jest.mock("@/lib/bag-ogc", () => ({
  fetchBagRegister: jest.fn(),
}));

const { fetchBagRegister } = jest.requireMock("@/lib/bag-ogc") as {
  fetchBagRegister: jest.Mock;
};

describe("GET /api/property/[id]/area", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    fetchBagRegister.mockReset();
  });

  it("returns area stats and sanitizes sentinel values", async () => {
    fetchBagRegister.mockResolvedValue({
      coordinates: { lon: 4.8937, lat: 52.3733 },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              buurtnaam: "Oude Kerk e.o.",
              buurtcode: "BU03630001",
              gemeentenaam: "Amsterdam",
              gemeentecode: "0363",
              aantal_inwoners: 705,
              aantal_huishoudens: 515,
              bevolkingsdichtheid_inwoners_per_km2: 8012,
              gemiddeld_inkomen_per_inwoner: -99999999,
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "0363010003761571" }),
    });
    const body = await response.json();

    expect(body.status).toBe("loaded");
    expect(body.data.buurtnaam).toBe("Oude Kerk e.o.");
    expect(body.data.gemiddeldInkomenPerInwoner).toBeNull();
  });
});
