/** @jest-environment node */
import { GET } from "@/app/api/property/[id]/foundation/route";

jest.mock("@/lib/bag-ogc", () => ({
  fetchBagRegister: jest.fn(),
}));

const { fetchBagRegister } = jest.requireMock("@/lib/bag-ogc") as {
  fetchBagRegister: jest.Mock;
};

describe("GET /api/property/[id]/foundation", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    fetchBagRegister.mockReset();
  });

  it("returns loaded section from RVO area API", async () => {
    fetchBagRegister.mockResolvedValue({
      coordinates: { lon: 4.8937, lat: 52.3733 },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              legenda: "Stedelijk gebied - 60-80 %",
              pc6: "1012JS",
              gemeente: "Amsterdam",
              percvoor1970: "75",
              n_bag: "8",
              popuptext: "Indicatief gebied",
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
    expect(body.data).toEqual(
      expect.objectContaining({
        inAttentionArea: true,
        postcode6: "1012JS",
        municipality: "Amsterdam",
      }),
    );
  });

  it("returns empty when BAG coordinates are unavailable", async () => {
    fetchBagRegister.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "0363010003761571" }),
    });
    const body = await response.json();

    expect(body.status).toBe("empty");
  });
});
