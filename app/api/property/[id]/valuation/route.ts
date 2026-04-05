import { NextResponse } from "next/server";
import type { BagRegisterPayload } from "@/lib/bag-ogc";
import { fetchBagRegister } from "@/lib/bag-ogc";
import { SOURCES } from "@/lib/sources";
import type {
  AreaSectionData,
  EnergySectionData,
  FoundationSectionData,
  SectionEnvelope,
  ValuationSectionData,
} from "@/lib/types";

export const runtime = "nodejs";

interface WozCandidate {
  value: number;
  referenceDate: string | null;
}

const MUNICIPALITY_BASE_EUR_PER_M2: Record<string, number> = {
  amsterdam: 8500,
  utrecht: 6200,
  rotterdam: 5000,
  "den haag": 5200,
  eindhoven: 4600,
};

const ENERGY_FACTORS: Record<string, number> = {
  "A++++": 1.09,
  "A+++": 1.08,
  "A++": 1.07,
  "A+": 1.06,
  A: 1.05,
  B: 1.03,
  C: 1,
  D: 0.97,
  E: 0.94,
  F: 0.9,
  G: 0.86,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replaceAll(".", "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function fetchSection<T>(
  requestUrl: string,
  propertyId: string,
  key: "area" | "energy" | "foundation",
): Promise<SectionEnvelope<T> | null> {
  try {
    const url = new URL(`/api/property/${encodeURIComponent(propertyId)}/${key}`, requestUrl);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as SectionEnvelope<T>;
  } catch {
    return null;
  }
}

async function fetchWozValue(
  bag: BagRegisterPayload,
): Promise<WozCandidate | null> {
  const apiKey = process.env.WOZ_API_KEY;
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (apiKey?.trim()) {
    headers["X-Api-Key"] = apiKey.trim();
  }

  const endpoints = [
    `https://woz-api.nl/Api/AdresseerbaarObject/${encodeURIComponent(bag.verblijfsobjectId)}`,
    bag.hoofdadresId
      ? `https://woz-api.nl/Api/Nummeraanduiding/${encodeURIComponent(bag.hoofdadresId)}`
      : null,
  ].filter((x): x is string => Boolean(x));

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) continue;

      const json = (await res.json()) as {
        woz?: Array<{ peildatum?: string | null; vastgesteldeWaarde?: number | null }>;
      };
      const values = json.woz ?? [];
      if (!values.length) continue;

      const latest = [...values].sort((a, b) => {
        const ad = typeof a.peildatum === "string" ? Date.parse(a.peildatum) : 0;
        const bd = typeof b.peildatum === "string" ? Date.parse(b.peildatum) : 0;
        return bd - ad;
      })[0];

      const value = asNumber(latest.vastgesteldeWaarde);
      if (value == null) continue;
      return {
        value,
        referenceDate: typeof latest.peildatum === "string" ? latest.peildatum : null,
      };
    } catch {
      continue;
    }
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json(
      {
        status: "error",
        data: null,
        source: SOURCES.valuation,
        fetchedAt: new Date().toISOString(),
        error: { code: "BAD_REQUEST", message: "Missing property id" },
      } satisfies SectionEnvelope<null>,
      { status: 400 },
    );
  }

  try {
    const bag = await fetchBagRegister(id.trim());
    if (!bag) {
      return NextResponse.json({
        status: "empty",
        data: null,
        source: SOURCES.valuation,
        fetchedAt: new Date().toISOString(),
      } satisfies SectionEnvelope<ValuationSectionData>);
    }

    const [areaEnv, energyEnv, foundationEnv, woz] = await Promise.all([
      fetchSection<AreaSectionData>(request.url, id, "area"),
      fetchSection<EnergySectionData>(request.url, id, "energy"),
      fetchSection<FoundationSectionData>(request.url, id, "foundation"),
      fetchWozValue(bag),
    ]);

    const area = areaEnv?.status === "loaded" ? areaEnv.data : null;
    const energy = energyEnv?.status === "loaded" ? energyEnv.data : null;
    const foundation = foundationEnv?.status === "loaded" ? foundationEnv.data : null;

    const municipality = (bag.woonplaatsNaam ?? area?.gemeentenaam ?? "").toLowerCase();
    const basePerM2 = MUNICIPALITY_BASE_EUR_PER_M2[municipality] ?? 4700;
    const floorAreaM2 = bag.oppervlakteM2;
    const baselineEstimate = floorAreaM2 != null ? basePerM2 * floorAreaM2 : null;

    const energyFactor =
      energy?.energyClass != null
        ? ENERGY_FACTORS[energy.energyClass.toUpperCase()] ?? 1
        : 1;
    const foundationFactor = foundation?.inAttentionArea ? 0.95 : 1;
    const incomeFactor =
      area?.gemiddeldInkomenPerInwoner != null
        ? clamp(0.9 + (area.gemiddeldInkomenPerInwoner / 45000) * 0.2, 0.85, 1.15)
        : 1;

    const modeledMid = baselineEstimate
      ? baselineEstimate * energyFactor * foundationFactor * incomeFactor
      : null;
    const blendedMid =
      modeledMid != null && woz != null
        ? Math.round(modeledMid * 0.45 + woz.value * 0.55)
        : modeledMid != null
          ? Math.round(modeledMid)
          : woz?.value ?? null;

    if (blendedMid == null) {
      return NextResponse.json({
        status: "empty",
        data: null,
        source: SOURCES.valuation,
        fetchedAt: new Date().toISOString(),
      } satisfies SectionEnvelope<ValuationSectionData>);
    }

    const drivers: string[] = [];
    const caveats: string[] = [];

    drivers.push(`BAG floor area ${floorAreaM2 ?? "unknown"} m2`);
    drivers.push(`Municipality baseline EUR/m2 ${Math.round(basePerM2)}`);
    if (energy?.energyClass) {
      drivers.push(`Energy class ${energy.energyClass} adjustment`);
    } else {
      caveats.push("No energy-class input used in valuation.");
    }
    if (foundation?.inAttentionArea) {
      drivers.push("Foundation attention-area discount applied");
    }
    if (woz) {
      drivers.push("WOZ value blended into midpoint");
    } else {
      caveats.push(
        "WOZ value unavailable from WozApi (set WOZ_API_KEY for stable free-tier access).",
      );
    }
    if (area?.gemiddeldInkomenPerInwoner == null) {
      caveats.push("CBS income signal unavailable; area adjustment limited.");
    }

    let confidence: ValuationSectionData["confidence"] = "low";
    if (woz && floorAreaM2 != null && energy?.energyClass) {
      confidence = "high";
    } else if (floorAreaM2 != null && (woz != null || energy?.energyClass != null)) {
      confidence = "medium";
    }

    const spread = confidence === "high" ? 0.1 : confidence === "medium" ? 0.16 : 0.24;
    const low = Math.round(blendedMid * (1 - spread));
    const high = Math.round(blendedMid * (1 + spread));

    const data: ValuationSectionData = {
      modelVersion: "free-beta-0.1",
      estimateEur: { low, mid: blendedMid, high },
      confidence,
      valuePerM2:
        floorAreaM2 != null && floorAreaM2 > 0
          ? Math.round(blendedMid / floorAreaM2)
          : null,
      floorAreaM2,
      wozValueEur: woz?.value ?? null,
      wozReferenceDate: woz?.referenceDate ?? null,
      municipality: bag.woonplaatsNaam ?? area?.gemeentenaam ?? null,
      drivers,
      caveats,
    };

    return NextResponse.json({
      status: "loaded",
      data,
      source: SOURCES.valuation,
      fetchedAt: new Date().toISOString(),
    } satisfies SectionEnvelope<ValuationSectionData>);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Valuation model execution failed.";
    return NextResponse.json({
      status: "error",
      data: null,
      source: SOURCES.valuation,
      fetchedAt: new Date().toISOString(),
      error: { code: "FETCH", message },
    } satisfies SectionEnvelope<ValuationSectionData>);
  }
}
