import { searchBagAddresses } from "@/lib/pdok";

function mockJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("searchBagAddresses", () => {
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.restoreAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("returns mapped resolve matches from PDOK docs", async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        response: {
          docs: [
            {
              weergavenaam: "Dam 1, 1012JS Amsterdam",
              nummeraanduiding_id: "0363200003761447",
              adresseerbaarobject_id: "0363010003761571",
              straatnaam: "Dam",
              postcode: "1012JS",
              huisnummer: 1,
              woonplaatsnaam: "Amsterdam",
            },
          ],
        },
      }),
    );

    const matches = await searchBagAddresses({
      postcode: "1012 js",
      huisnummer: "1",
      woonplaatsnaam: "Amsterdam",
    });

    expect(matches).toEqual([
      expect.objectContaining({
        id: "0363010003761571",
        nummeraanduidingId: "0363200003761447",
        addressLabel: "Dam 1, 1012JS Amsterdam",
      }),
    ]);

    const firstCallUrl = String(fetchMock.mock.calls[0][0]);
    expect(firstCallUrl).toContain("postcode%3A1012JS");
    expect(firstCallUrl).toContain("huisnummer%3A1");
    expect(firstCallUrl).toContain("woonplaatsnaam%3AAmsterdam");
  });

  it("throws when PDOK responds with non-200", async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ error: "oops" }, 503));

    await expect(
      searchBagAddresses({ postcode: "1012JS", huisnummer: "1" }),
    ).rejects.toThrow("PDOK Locatieserver error: 503");
  });

  it("returns empty array for missing postcode or house number", async () => {
    await expect(
      searchBagAddresses({ postcode: "", huisnummer: "1" }),
    ).resolves.toEqual([]);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
