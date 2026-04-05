import { NextResponse } from "next/server";
import { fetchBagRegister } from "@/lib/bag-ogc";
import { SOURCES } from "@/lib/sources";
import type { FoundationSectionData, SectionEnvelope } from "@/lib/types";

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
      source: SOURCES.foundation,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<FoundationSectionData>);
  }

  try {
    const delta = 0.0002;
    const bbox = [
      coords.lon - delta,
      coords.lat - delta,
      coords.lon + delta,
      coords.lat + delta,
    ].join(",");
    const url = new URL(
      "https://api.pdok.nl/rvo/indicatieve-aandachtsgebieden-funderingsproblematiek/ogc/v1/collections/indgebfunderingsproblematiek/items",
    );
    url.searchParams.set("bbox", bbox);
    url.searchParams.set("f", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({
        status: "error",
        data: null,
        source: SOURCES.foundation,
        fetchedAt: new Date().toISOString(),
        error: {
          code: "UPSTREAM",
          message: `Foundation area API failed (${res.status}).`,
        },
      } satisfies SectionEnvelope<FoundationSectionData>);
    }

    const json = (await res.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };
    const props = json.features?.[0]?.properties;
    if (!props) {
      return NextResponse.json({
        status: "empty",
        data: null,
        source: SOURCES.foundation,
        fetchedAt: new Date().toISOString(),
      } satisfies SectionEnvelope<FoundationSectionData>);
    }

    const data: FoundationSectionData = {
      inAttentionArea: true,
      areaLegend: typeof props.legenda === "string" ? props.legenda : null,
      postcode6: typeof props.pc6 === "string" ? props.pc6 : null,
      municipality: typeof props.gemeente === "string" ? props.gemeente : null,
      pre1970SharePct:
        typeof props.percvoor1970 === "string" ? Number(props.percvoor1970) : null,
      bagCount: typeof props.n_bag === "string" ? Number(props.n_bag) : null,
      summary: typeof props.popuptext === "string" ? props.popuptext : null,
    };
    return NextResponse.json({
      status: "loaded",
      data,
      source: SOURCES.foundation,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<FoundationSectionData>);
  } catch (e) {
    return NextResponse.json({
      status: "error",
      data: null,
      source: SOURCES.foundation,
      fetchedAt: new Date().toISOString(),
      error: {
        code: "FETCH",
        message: e instanceof Error ? e.message : "Foundation lookup failed.",
      },
    } satisfies SectionEnvelope<FoundationSectionData>);
  }
}
