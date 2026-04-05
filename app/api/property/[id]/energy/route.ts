import { NextResponse } from "next/server";
import { SOURCES } from "@/lib/sources";
import type { EnergySectionData, SectionEnvelope } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const url = new URL("https://api.data.amsterdam.nl/v1/duurzaamheid/energielabel");
    url.searchParams.set("bagVerblijfsobjectId", id);
    url.searchParams.set("page_size", "10");
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json({
        status: "error",
        data: null,
        source: SOURCES.energy,
        fetchedAt: new Date().toISOString(),
        error: {
          code: "UPSTREAM",
          message: `Energy label API failed (${res.status}).`,
        },
      } satisfies SectionEnvelope<EnergySectionData>);
    }

    const json = (await res.json()) as {
      _embedded?: { energielabel?: Array<Record<string, unknown>> };
    };
    const labels = json._embedded?.energielabel ?? [];
    if (!labels.length) {
      return NextResponse.json({
        status: "empty",
        data: null,
        source: SOURCES.energy,
        fetchedAt: new Date().toISOString(),
      } satisfies SectionEnvelope<EnergySectionData>);
    }

    const latest = [...labels].sort((a, b) => {
      const ad =
        typeof a.registratiedatum === "string" ? Date.parse(a.registratiedatum) : 0;
      const bd =
        typeof b.registratiedatum === "string" ? Date.parse(b.registratiedatum) : 0;
      return bd - ad;
    })[0];

    const data: EnergySectionData = {
      energyClass:
        typeof latest.energieklasse === "string" ? latest.energieklasse : null,
      validityDate:
        typeof latest.metingGeldigTot === "string" ? latest.metingGeldigTot : null,
      recordingDate:
        typeof latest.registratiedatum === "string" ? latest.registratiedatum : null,
      buildingType:
        typeof latest.gebouwtype === "string" ? latest.gebouwtype : null,
      calculationType:
        typeof latest.berekeningstype === "string" ? latest.berekeningstype : null,
      sourceRecordId: typeof latest.id === "string" ? latest.id : null,
    };

    return NextResponse.json({
      status: "loaded",
      data,
      source: SOURCES.energy,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<EnergySectionData>);
  } catch (e) {
    return NextResponse.json({
      status: "error",
      data: null,
      source: SOURCES.energy,
      fetchedAt: new Date().toISOString(),
      error: {
        code: "FETCH",
        message: e instanceof Error ? e.message : "Energy lookup failed.",
      },
    } satisfies SectionEnvelope<EnergySectionData>);
  }
}
