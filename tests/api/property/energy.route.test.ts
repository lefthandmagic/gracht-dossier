/** @jest-environment node */
import { GET } from "@/app/api/property/[id]/energy/route";

describe("GET /api/property/[id]/energy", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns latest energy label", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        _embedded: {
          energielabel: [
            {
              id: "old",
              registratiedatum: "2018-03-15",
              metingGeldigTot: "2028-01-30",
              energieklasse: "A",
              gebouwtype: "Flatwoning",
              berekeningstype: "ISSO75.3",
            },
            {
              id: "new",
              registratiedatum: "2020-01-01",
              metingGeldigTot: "2030-01-01",
              energieklasse: "A+",
              gebouwtype: "Flatwoning",
              berekeningstype: "NTA8800",
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
    expect(body.data.sourceRecordId).toBe("new");
    expect(body.data.energyClass).toBe("A+");
  });
});
