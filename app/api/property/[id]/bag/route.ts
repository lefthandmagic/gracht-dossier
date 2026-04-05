import { NextResponse } from "next/server";
import { fetchBagRegister } from "@/lib/bag-ogc";
import { SOURCES } from "@/lib/sources";
import type { SectionEnvelope } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json(
      {
        status: "error",
        data: null,
        source: SOURCES.bagOgc,
        fetchedAt: new Date().toISOString(),
        error: { code: "BAD_REQUEST", message: "Missing property id" },
      } satisfies SectionEnvelope<null>,
      { status: 400 },
    );
  }

  try {
    const data = await fetchBagRegister(id.trim());
    if (!data) {
      return NextResponse.json({
        status: "empty",
        data: null,
        source: SOURCES.bagOgc,
        fetchedAt: new Date().toISOString(),
      } satisfies SectionEnvelope<null>);
    }

    return NextResponse.json({
      status: "loaded",
      data,
      source: SOURCES.bagOgc,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<typeof data>);
  } catch (e) {
    const message = e instanceof Error ? e.message : "BAG OGC request failed";
    return NextResponse.json({
      status: "error",
      data: null,
      source: SOURCES.bagOgc,
      fetchedAt: new Date().toISOString(),
      error: { code: "UPSTREAM", message },
    } satisfies SectionEnvelope<null>);
  }
}
