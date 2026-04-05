import type { BagRegisterPayload } from "@/lib/bag-ogc";
import {
  PROPERTY_SECTIONS,
  type PropertySectionKey,
} from "@/lib/property-sections-client";
import type {
  AreaSectionData,
  EnergySectionData,
  FoundationSectionData,
  HeritageSectionData,
  SectionEnvelope,
  ZoningSectionData,
} from "@/lib/types";

type PropertySectionMap = Partial<Record<PropertySectionKey, SectionEnvelope<unknown>>>;

export type MemoVerdict = "Proceed" | "Proceed with conditions" | "High attention";

export interface MemoRisk {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
}

export interface MemoAssessment {
  verdict: MemoVerdict;
  verdictReason: string;
  risks: MemoRisk[];
  actions: string[];
  missingData: string[];
}

const ENERGY_ORDER = ["A++++", "A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G"];

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : new Date(ts);
}

function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

function isSoon(date: Date): boolean {
  const days = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 90;
}

function isLikelyActiveStatus(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized.includes("in gebruik") || normalized.includes("actief");
}

function getLoaded<T>(section: SectionEnvelope<unknown> | undefined): T | null {
  if (section?.status !== "loaded" || section.data == null) return null;
  return section.data as T;
}

export function buildMemoAssessment(sections: PropertySectionMap): MemoAssessment {
  const risks: MemoRisk[] = [];
  const actions: string[] = [];
  const missingData: string[] = [];

  const bagEnv = sections.bag;
  const foundationEnv = sections.foundation;
  const heritageEnv = sections.heritage;
  const zoningEnv = sections.zoning;
  const energyEnv = sections.energy;
  const areaEnv = sections.area;

  const bag = getLoaded<BagRegisterPayload>(bagEnv);
  const foundation = getLoaded<FoundationSectionData>(foundationEnv);
  const heritage = getLoaded<HeritageSectionData>(heritageEnv);
  const zoning = getLoaded<ZoningSectionData>(zoningEnv);
  const energy = getLoaded<EnergySectionData>(energyEnv);
  const area = getLoaded<AreaSectionData>(areaEnv);

  if (energy?.energyClass) {
    const normalizedClass = energy.energyClass.toUpperCase();
    const idx = ENERGY_ORDER.indexOf(normalizedClass);
    if (idx >= ENERGY_ORDER.indexOf("E")) {
      risks.push({
        severity: idx >= ENERGY_ORDER.indexOf("F") ? "high" : "medium",
        title: `Energy class ${normalizedClass}`,
        detail:
          "Likely higher heating costs and stronger renovation pressure than better-rated homes.",
      });
      actions.push(
        "Request a renovation quote for insulation/heating upgrades and estimate post-upgrade running costs.",
      );
    }
  } else if (energyEnv?.status === "empty") {
    missingData.push("No energy label row found in the Amsterdam energy register feed.");
  }

  const validTo = parseDate(energy?.validityDate);
  if (validTo && isPast(validTo)) {
    risks.push({
      severity: "medium",
      title: "Energy label validity expired",
      detail: "The recorded label is out of date, so current energy performance is uncertain.",
    });
  } else if (validTo && isSoon(validTo)) {
    risks.push({
      severity: "low",
      title: "Energy label expires soon",
      detail: "Plan for a refreshed label after transfer or renovation.",
    });
  }

  if (foundation?.inAttentionArea) {
    const ageHint =
      foundation.pre1970SharePct != null
        ? ` Area pre-1970 share: ${foundation.pre1970SharePct.toFixed(1)}%.`
        : "";
    risks.push({
      severity: "high",
      title: "Foundation attention area",
      detail: `Register indicates an indicative attention area for foundation risk.${ageHint}`,
    });
    actions.push(
      "Ask seller/VvE for recent foundation or structural reports and budget for targeted technical inspection.",
    );
  } else if (foundationEnv?.status === "empty") {
    missingData.push(
      "No foundation attention-area result could be linked (missing geometry or no matching area).",
    );
  }

  if (zoning?.hasAreaDesignations) {
    risks.push({
      severity: "medium",
      title: "Area designations present",
      detail:
        "Additional planning overlays can add permit constraints or longer lead times for renovations.",
    });
    actions.push(
      "Check municipality permit feasibility for planned renovations before making the final bid.",
    );
  } else if (zoningEnv?.status === "empty") {
    missingData.push("No zoning result returned for this location point.");
  }

  const zoningTopics = (zoning?.topSubjects ?? []).join(" ").toLowerCase();
  if (zoningTopics.includes("archeologie") || zoningTopics.includes("cultuurhistorie")) {
    risks.push({
      severity: "medium",
      title: "Cultural or archaeology planning subject",
      detail:
        "Cultural-history or archaeology zoning subjects may require additional checks during permit review.",
    });
  }

  if (heritage && heritage.monumentCount > 0) {
    risks.push({
      severity: "medium",
      title: "Heritage records linked to this building",
      detail:
        "Monument status can affect renovation scope, approval path, timeline, and expected costs.",
    });
    actions.push(
      "Confirm monument-related constraints and acceptable renovation scope with the municipality.",
    );
  } else if (heritageEnv?.status === "empty") {
    missingData.push("No row from the Amsterdam monument register was returned for this object.");
  }

  if (bag?.gebruiksdoel && !bag.gebruiksdoel.toLowerCase().includes("woon")) {
    risks.push({
      severity: "high",
      title: "BAG use is not clearly residential",
      detail: `Current BAG use is "${bag.gebruiksdoel}", so legal use should be validated before bidding.`,
    });
    actions.push("Verify legal use and occupancy position with the agent/notary.");
  }

  if (bag?.vboStatus && !isLikelyActiveStatus(bag.vboStatus)) {
    risks.push({
      severity: "medium",
      title: "Verblijfsobject status needs confirmation",
      detail: `BAG object status is "${bag.vboStatus}", which is not the normal active token.`,
    });
  }

  if (bag?.pandStatus && !isLikelyActiveStatus(bag.pandStatus)) {
    risks.push({
      severity: "medium",
      title: "Pand status needs confirmation",
      detail: `BAG building status is "${bag.pandStatus}", which can affect transfer and permit assumptions.`,
    });
  }

  if (bagEnv?.status === "empty") {
    missingData.push("Core BAG building record was empty for this property.");
  }

  if (areaEnv?.status === "loaded" && area) {
    const allSuppressed =
      area.inwoners == null &&
      area.huishoudens == null &&
      area.bevolkingsdichtheid == null &&
      area.gemiddeldInkomenPerInwoner == null;
    if (allSuppressed) {
      missingData.push("CBS neighborhood metrics are unavailable or suppressed for this area.");
    }
  } else if (areaEnv?.status === "empty") {
    missingData.push("No CBS neighborhood area row was returned for this location point.");
  }

  for (const section of PROPERTY_SECTIONS) {
    const env = sections[section.key];
    if (env?.status === "error") {
      missingData.push(
        `${section.key}: ${env.error?.message ?? "Section fetch failed."}`,
      );
    }
  }

  const uniqueActions = Array.from(new Set(actions));
  if (missingData.length > 0) {
    uniqueActions.push(
      "Resolve missing/error sections and re-run memo before final bid decision.",
    );
  }

  const score = risks.reduce((sum, risk) => {
    if (risk.severity === "high") return sum + 3;
    if (risk.severity === "medium") return sum + 2;
    return sum + 1;
  }, 0);
  const highCount = risks.filter((r) => r.severity === "high").length;

  let verdict: MemoVerdict = "Proceed";
  if (highCount >= 2 || score >= 7) {
    verdict = "High attention";
  } else if (score >= 3 || missingData.length >= 2) {
    verdict = "Proceed with conditions";
  }

  const verdictReason =
    risks.length === 0
      ? "No high-impact register signals were detected from currently loaded sections."
      : `${risks.length} register-based signal(s) detected, including ${highCount} high-priority item(s).`;

  return {
    verdict,
    verdictReason,
    risks,
    actions: uniqueActions,
    missingData,
  };
}
