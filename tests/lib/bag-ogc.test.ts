import { fetchBagRegister } from "@/lib/bag-ogc";

function mockJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("fetchBagRegister", () => {
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.restoreAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("combines verblijfsobject and linked pand data", async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse({
          features: [
            {
              properties: {
                identificatie: "0363010003761571",
                hoofdadres_identificatie: "0363200003761447",
                openbare_ruimte_naam: "Dam",
                postcode: "1012JS",
                huisnummer: 1,
                gebruiksdoel: "winkelfunctie",
                oppervlakte: 23820,
                status: "Verblijfsobject in gebruik",
                woonplaats_naam: "Amsterdam",
                documentdatum: "2013-10-11",
                rdf_seealso:
                  "http://bag.basisregistraties.overheid.nl/bag/id/verblijfsobject/0363010003761571",
                "pand.href": [
                  "https://api.pdok.nl/kadaster/bag/ogc/v2/collections/pand/items/foo",
                ],
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          properties: {
            bouwjaar: 1914,
            identificatie: "0363100012168052",
            status: "Pand in gebruik",
          },
        }),
      );

    const payload = await fetchBagRegister("0363010003761571");

    expect(payload).toEqual(
      expect.objectContaining({
        verblijfsobjectId: "0363010003761571",
        pandBouwjaar: 1914,
        pandId: "0363100012168052",
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null when no feature exists", async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ features: [] }));

    await expect(fetchBagRegister("0363010003761571")).resolves.toBeNull();
  });

  it("throws when verblijfsobject request fails", async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ error: "bad" }, 500));

    await expect(fetchBagRegister("0363010003761571")).rejects.toThrow(
      "BAG OGC verblijfsobject: HTTP 500",
    );
  });
});
