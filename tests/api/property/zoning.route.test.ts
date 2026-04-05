/** @jest-environment node */
import { GET } from "@/app/api/property/[id]/zoning/route";

jest.mock("@/lib/bag-ogc", () => ({
  fetchBagRegister: jest.fn(),
}));

const { fetchBagRegister } = jest.requireMock("@/lib/bag-ogc") as {
  fetchBagRegister: jest.Mock;
};

describe("GET /api/property/[id]/zoning", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    fetchBagRegister.mockReset();
  });

  it("returns loaded zoning subjects", async () => {
    fetchBagRegister.mockResolvedValue({
      coordinates: { lon: 4.8937, lat: 52.3733 },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bestemmingsvlakken: [
          {
            onderwerp: "Centrum-1",
            referenties: [{ planId: "NL.IMRO.0363.A1105BPSTD-VG03" }],
          },
        ],
        gebiedsaanduidingen: [],
      }),
    }) as unknown as typeof fetch;

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "0363010003761571" }),
    });
    const body = await response.json();

    expect(body.status).toBe("loaded");
    expect(body.data.topSubjects).toContain("Centrum-1");
  });
});
