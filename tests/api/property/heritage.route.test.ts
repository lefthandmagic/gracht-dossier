/** @jest-environment node */
import { GET } from "@/app/api/property/[id]/heritage/route";

jest.mock("@/lib/bag-ogc", () => ({
  fetchBagRegister: jest.fn(),
}));

const { fetchBagRegister } = jest.requireMock("@/lib/bag-ogc") as {
  fetchBagRegister: jest.Mock;
};

describe("GET /api/property/[id]/heritage", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    fetchBagRegister.mockReset();
  });

  it("returns loaded monuments summary", async () => {
    fetchBagRegister.mockResolvedValue({ pandId: "0363100012168052" });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        _embedded: {
          monumenten: [
            {
              monumentnummer: 518426,
              naam: "De Bijenkorf",
              status: "Rijksmonument",
              type: "Pand",
              datumAanwijzing: "2001-07-13T02:00:00",
            },
          ],
        },
      }),
    }) as unknown as typeof fetch;

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "0363010003761571" }),
    });
    const body = await response.json();

    expect(body.status).toBe("loaded");
    expect(body.data.monumentCount).toBe(1);
    expect(body.data.statuses).toContain("Rijksmonument");
  });
});
