import { NextResponse } from "next/server";
import { fetchBagRegister } from "@/lib/bag-ogc";
import { SOURCES } from "@/lib/sources";
import type { SectionEnvelope, ZoningSectionData } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bag = await fetchBagRegister(id);
  const coords = bag?.coordinates;
  if (!coords) {
    return NextResponse.json({
      status: "empty",
      data: null,
      source: SOURCES.zoning,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<ZoningSectionData>);
  }

  try {
    const res = await fetch(
      "https://ruimte.omgevingswet.overheid.nl/ruimtelijke-plannen/api/opvragen/v4/onderwerpen/_zoek",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _geo: {
            contains: {
              type: "Point",
              coordinates: [coords.lon, coords.lat],
            },
          },
        }),
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) {
      return NextResponse.json({
        status: "error",
        data: null,
        source: SOURCES.zoning,
        fetchedAt: new Date().toISOString(),
        error: {
          code: "UPSTREAM",
          message: `Zoning onderwerpen API failed (${res.status}).`,
        },
      } satisfies SectionEnvelope<ZoningSectionData>);
    }

    const json = (await res.json()) as {
      bestemmingsvlakken?: Array<{
        onderwerp?: string;
        referenties?: Array<{ planId?: string }>;
      }>;
      gebiedsaanduidingen?: Array<{
        onderwerp?: string;
        referenties?: Array<{ planId?: string }>;
      }>;
    };

    const topSubjects = (json.bestemmingsvlakken ?? [])
      .map((x) => x.onderwerp)
      .filter((x): x is string => typeof x === "string")
      .slice(0, 5);
    const planIds = Array.from(
      new Set(
        [...(json.bestemmingsvlakken ?? []), ...(json.gebiedsaanduidingen ?? [])]
          .flatMap((x) => x.referenties ?? [])
          .map((r) => r.planId)
          .filter((x): x is string => typeof x === "string"),
      ),
    ).slice(0, 5);

    if (!topSubjects.length && !planIds.length) {
      return NextResponse.json({
        status: "empty",
        data: null,
        source: SOURCES.zoning,
        fetchedAt: new Date().toISOString(),
      } satisfies SectionEnvelope<ZoningSectionData>);
    }

    const data: ZoningSectionData = {
      topSubjects,
      planIds,
      hasAreaDesignations: (json.gebiedsaanduidingen?.length ?? 0) > 0,
    };
    return NextResponse.json({
      status: "loaded",
      data,
      source: SOURCES.zoning,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<ZoningSectionData>);
  } catch (e) {
    return NextResponse.json({
      status: "error",
      data: null,
      source: SOURCES.zoning,
      fetchedAt: new Date().toISOString(),
      error: {
        code: "FETCH",
        message: e instanceof Error ? e.message : "Zoning lookup failed.",
      },
    } satisfies SectionEnvelope<ZoningSectionData>);
  }
}
