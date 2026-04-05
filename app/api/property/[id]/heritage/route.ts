import { NextResponse } from "next/server";
import { fetchBagRegister } from "@/lib/bag-ogc";
import { SOURCES } from "@/lib/sources";
import type { HeritageSectionData, SectionEnvelope } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bag = await fetchBagRegister(id);
  if (!bag?.pandId) {
    return NextResponse.json({
      status: "empty",
      data: null,
      source: SOURCES.heritage,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<HeritageSectionData>);
  }

  try {
    const url = new URL("https://api.data.amsterdam.nl/v1/monumenten/monumenten");
    url.searchParams.set("betreftBagPand.identificatie", bag.pandId);
    url.searchParams.set("page_size", "10");

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({
        status: "error",
        data: null,
        source: SOURCES.heritage,
        fetchedAt: new Date().toISOString(),
        error: {
          code: "UPSTREAM",
          message: `Monumenten API failed (${res.status}).`,
        },
      } satisfies SectionEnvelope<HeritageSectionData>);
    }

    const json = (await res.json()) as {
      _embedded?: {
        monumenten?: Array<Record<string, unknown>>;
      };
    };
    const rows = json._embedded?.monumenten ?? [];
    if (!rows.length) {
      return NextResponse.json({
        status: "empty",
        data: null,
        source: SOURCES.heritage,
        fetchedAt: new Date().toISOString(),
      } satisfies SectionEnvelope<HeritageSectionData>);
    }

    const statuses = Array.from(
      new Set(
        rows
          .map((r) => (typeof r.status === "string" ? r.status : null))
          .filter((x): x is string => Boolean(x)),
      ),
    );

    const topMonuments = rows.slice(0, 3).map((row) => ({
      monumentnummer:
        typeof row.monumentnummer === "number" ? row.monumentnummer : null,
      naam: typeof row.naam === "string" ? row.naam : null,
      status: typeof row.status === "string" ? row.status : null,
      type: typeof row.type === "string" ? row.type : null,
      datumAanwijzing:
        typeof row.datumAanwijzing === "string" ? row.datumAanwijzing : null,
    }));

    const data: HeritageSectionData = {
      monumentCount: rows.length,
      statuses,
      topMonuments,
    };
    return NextResponse.json({
      status: "loaded",
      data,
      source: SOURCES.heritage,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<HeritageSectionData>);
  } catch (e) {
    return NextResponse.json({
      status: "error",
      data: null,
      source: SOURCES.heritage,
      fetchedAt: new Date().toISOString(),
      error: {
        code: "FETCH",
        message: e instanceof Error ? e.message : "Heritage lookup failed.",
      },
    } satisfies SectionEnvelope<HeritageSectionData>);
  }
}
