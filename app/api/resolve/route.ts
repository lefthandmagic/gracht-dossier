import { NextResponse } from "next/server";
import { searchBagAddresses } from "@/lib/pdok";
import type { ResolveRequestBody } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: ResolveRequestBody;
  try {
    body = (await request.json()) as ResolveRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const postcode = String(body.postcode ?? "").trim();
  const huisnummer = String(body.huisnummer ?? "").trim();
  if (!postcode || !huisnummer) {
    return NextResponse.json(
      { error: "postcode and huisnummer are required" },
      { status: 400 },
    );
  }

  try {
    const matches = await searchBagAddresses({
      postcode,
      huisnummer,
      huisletter: body.huisletter,
      huisnummertoevoeging: body.huisnummertoevoeging,
      woonplaatsnaam: body.woonplaatsnaam ?? "Amsterdam",
    });
    return NextResponse.json({ matches });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Resolve failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
