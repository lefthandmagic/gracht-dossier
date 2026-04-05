import { NextResponse } from "next/server";
import { SOURCES, stubSectionEnvelope } from "@/lib/sources";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params;
  return NextResponse.json(stubSectionEnvelope(SOURCES.foundation));
}
