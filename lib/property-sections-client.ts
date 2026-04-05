import type { SectionEnvelope } from "@/lib/types";

export type PropertySectionKey =
  | "bag"
  | "foundation"
  | "heritage"
  | "zoning"
  | "energy"
  | "area";

export const PROPERTY_SECTIONS: Array<{ key: PropertySectionKey; title: string }> = [
  { key: "bag", title: "Building (BAG)" },
  { key: "foundation", title: "Foundation" },
  { key: "heritage", title: "Heritage" },
  { key: "zoning", title: "Zoning" },
  { key: "energy", title: "Energy" },
  { key: "area", title: "Area (CBS)" },
];

export async function fetchPropertySection(
  propertyId: string,
  key: PropertySectionKey,
): Promise<SectionEnvelope<unknown>> {
  try {
    const res = await fetch(`/api/property/${encodeURIComponent(propertyId)}/${key}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        status: "error",
        data: null,
        source: { name: "App", url: "/" },
        fetchedAt: new Date().toISOString(),
        error: { code: "HTTP", message: `Request failed (${res.status})` },
      };
    }
    return (await res.json()) as SectionEnvelope<unknown>;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network error loading this section";
    return {
      status: "error",
      data: null,
      source: { name: "App", url: "/" },
      fetchedAt: new Date().toISOString(),
      error: { code: "FETCH", message },
    };
  }
}
