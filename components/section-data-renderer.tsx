"use client";

import type { BagRegisterPayload } from "@/lib/bag-ogc";
import type {
  AreaSectionData,
  EnergySectionData,
  FoundationSectionData,
  HeritageSectionData,
  ValuationSectionData,
  ZoningSectionData,
} from "@/lib/types";
import { BagRegisterDetails } from "@/components/bag-register-details";

function kv(label: string, value: React.ReactNode) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="text-zinc-900 dark:text-zinc-100">{value ?? "—"}</dd>
    </div>
  );
}

export function SectionDataRenderer({
  sectionKey,
  data,
}: {
  sectionKey:
    | "bag"
    | "foundation"
    | "heritage"
    | "zoning"
    | "energy"
    | "area"
    | "valuation";
  data: unknown;
}) {
  if (sectionKey === "bag") {
    return <BagRegisterDetails data={data as BagRegisterPayload} />;
  }

  if (sectionKey === "foundation") {
    const d = data as FoundationSectionData;
    return (
      <dl className="space-y-2">
        {kv("Attention area", d.inAttentionArea ? "Yes" : "No")}
        {kv("Legend", d.areaLegend)}
        {kv("Postcode", d.postcode6)}
        {kv("Municipality", d.municipality)}
        {kv(
          "Pre-1970 share",
          d.pre1970SharePct != null ? `${d.pre1970SharePct}%` : null,
        )}
        {kv("BAG buildings in area", d.bagCount)}
      </dl>
    );
  }

  if (sectionKey === "heritage") {
    const d = data as HeritageSectionData;
    return (
      <div className="space-y-3">
        <dl>{kv("Monuments linked", d.monumentCount)}</dl>
        <p className="text-sm">
          Statuses: {d.statuses.length ? d.statuses.join(", ") : "—"}
        </p>
        {d.topMonuments.length ? (
          <ul className="list-inside list-disc text-sm">
            {d.topMonuments.map((m) => (
              <li key={`${m.monumentnummer ?? "na"}-${m.naam ?? "unknown"}`}>
                {m.naam ?? "Unnamed monument"}{" "}
                {m.monumentnummer ? `(nr. ${m.monumentnummer})` : ""}{" "}
                {m.status ? `- ${m.status}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (sectionKey === "zoning") {
    const d = data as ZoningSectionData;
    return (
      <div className="space-y-2 text-sm">
        <p>
          Subjects: {d.topSubjects.length ? d.topSubjects.join(" | ") : "—"}
        </p>
        <p>Area designations: {d.hasAreaDesignations ? "Yes" : "No"}</p>
        {d.planIds.length ? (
          <p className="break-all text-zinc-600 dark:text-zinc-300">
            Plan IDs: {d.planIds.join(", ")}
          </p>
        ) : null}
      </div>
    );
  }

  if (sectionKey === "energy") {
    const d = data as EnergySectionData;
    return (
      <dl className="space-y-2">
        {kv("Energy class", d.energyClass)}
        {kv("Valid to", d.validityDate)}
        {kv("Recorded on", d.recordingDate)}
        {kv("Building type", d.buildingType)}
      </dl>
    );
  }

  const d = data as AreaSectionData;
  if (sectionKey === "area") {
    return (
      <dl className="space-y-2">
        {kv("Neighborhood", d.buurtnaam)}
        {kv("Municipality", d.gemeentenaam)}
        {kv("Residents", d.inwoners)}
        {kv("Households", d.huishoudens)}
        {kv(
          "Density",
          d.bevolkingsdichtheid != null
            ? `${d.bevolkingsdichtheid}/km²`
            : null,
        )}
        {kv("Avg income / resident", d.gemiddeldInkomenPerInwoner)}
      </dl>
    );
  }

  const v = data as ValuationSectionData;
  return (
    <div className="space-y-3">
      <dl className="space-y-2">
        {kv(
          "Estimated value",
          `EUR ${v.estimateEur.low.toLocaleString("en-GB")} - EUR ${v.estimateEur.high.toLocaleString("en-GB")}`,
        )}
        {kv("Model midpoint", `EUR ${v.estimateEur.mid.toLocaleString("en-GB")}`)}
        {kv("Confidence", v.confidence)}
        {kv(
          "Estimated EUR/m2",
          v.valuePerM2 != null ? `EUR ${v.valuePerM2.toLocaleString("en-GB")}` : null,
        )}
        {kv("Floor area (BAG)", v.floorAreaM2 != null ? `${v.floorAreaM2} m²` : null)}
        {kv("WOZ value", v.wozValueEur != null ? `EUR ${v.wozValueEur.toLocaleString("en-GB")}` : null)}
        {kv("WOZ reference date", v.wozReferenceDate)}
      </dl>
      <p className="text-sm">
        Drivers: {v.drivers.length ? v.drivers.join(" | ") : "—"}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Caveats: {v.caveats.length ? v.caveats.join(" | ") : "—"}
      </p>
    </div>
  );
}
