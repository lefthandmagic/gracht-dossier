import { NextResponse } from "next/server";
import { fetchBagRegister } from "@/lib/bag-ogc";
import { SOURCES } from "@/lib/sources";
import type { AreaSectionData, SectionEnvelope } from "@/lib/types";

export const runtime = "nodejs";

function cleanCbsNumber(value: unknown): number | null {
  if (typeof value !== "number") return null;
  // CBS sentinel values for unavailable/suppressed values are large negatives.
  if (value <= -99995) return null;
  return value;
}

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
      source: SOURCES.cbs,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<AreaSectionData>);
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
      "https://api.pdok.nl/cbs/wijken-en-buurten-2022/ogc/v1/collections/buurten/items",
    );
    url.searchParams.set("bbox", bbox);
    url.searchParams.set(
      "bbox-crs",
      "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
    );
    url.searchParams.set("limit", "1");
    url.searchParams.set("f", "json");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({
        status: "error",
        data: null,
        source: SOURCES.cbs,
        fetchedAt: new Date().toISOString(),
        error: { code: "UPSTREAM", message: `CBS buurt API failed (${res.status}).` },
      } satisfies SectionEnvelope<AreaSectionData>);
    }

    const json = (await res.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };
    const props = json.features?.[0]?.properties;
    if (!props) {
      return NextResponse.json({
        status: "empty",
        data: null,
        source: SOURCES.cbs,
        fetchedAt: new Date().toISOString(),
      } satisfies SectionEnvelope<AreaSectionData>);
    }

    const data: AreaSectionData = {
      buurtnaam: typeof props.buurtnaam === "string" ? props.buurtnaam : null,
      buurtcode: typeof props.buurtcode === "string" ? props.buurtcode : null,
      gemeentenaam:
        typeof props.gemeentenaam === "string" ? props.gemeentenaam : null,
      gemeentecode:
        typeof props.gemeentecode === "string" ? props.gemeentecode : null,
      inwoners: cleanCbsNumber(props.aantal_inwoners),
      huishoudens: cleanCbsNumber(props.aantal_huishoudens),
      bevolkingsdichtheid: cleanCbsNumber(
        props.bevolkingsdichtheid_inwoners_per_km2,
      ),
      gemiddeldInkomenPerInwoner: cleanCbsNumber(
        props.gemiddeld_inkomen_per_inwoner,
      ),
    };

    return NextResponse.json({
      status: "loaded",
      data,
      source: SOURCES.cbs,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<AreaSectionData>);
  } catch (e) {
    return NextResponse.json({
      status: "error",
      data: null,
      source: SOURCES.cbs,
      fetchedAt: new Date().toISOString(),
      error: { code: "FETCH", message: e instanceof Error ? e.message : "Area lookup failed." },
    } satisfies SectionEnvelope<AreaSectionData>);
  }
}
