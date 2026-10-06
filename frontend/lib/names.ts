/**
 * Single source of truth for zone and fixture display names.
 *
 * Replaces the duplicate local maps in:
 *  - FlowRateChart, CarbonView, CarbonBreakdownCard,
 *  - SensorIntelligenceSection, FixtureHealthView, HygieneView
 *  - and inline `.replace("T2_", "")` hacks.
 */

/** Full zone labels (for headers, tables, legends) */
export const ZONE_LABELS: Record<string, string> = {
  T2_Restroom_A: "Restroom A (Departure)",
  T2_Restroom_B: "Restroom B (Arrival)",
  T2_Family_Room: "Family room",
  T2_Staff_WC: "Staff WC",
};

/** Short zone labels (for chart direct labels, tight spaces) */
export const ZONE_LABELS_SHORT: Record<string, string> = {
  T2_Restroom_A: "Restroom A",
  T2_Restroom_B: "Restroom B",
  T2_Family_Room: "Family room",
  T2_Staff_WC: "Staff WC",
};

/** Ordered zone IDs (consistent rendering order everywhere) */
export const ZONE_IDS = [
  "T2_Restroom_A",
  "T2_Restroom_B",
  "T2_Family_Room",
  "T2_Staff_WC",
] as const;

export type ZoneId = (typeof ZONE_IDS)[number];

/**
 * Get the display label for a zone ID.
 * Falls back to a cleaned version of the raw ID if not found.
 */
export function getZoneLabel(zoneId: string, short = false): string {
  const map = short ? ZONE_LABELS_SHORT : ZONE_LABELS;
  return map[zoneId] ?? zoneId.replace(/^T2_/, "").replace(/_/g, " ");
}

/**
 * Get a short fixture label from a fixture ID.
 * e.g. "T2_RA_WC_03" → "WC 03"
 */
export function getFixtureShortLabel(fixtureId: string): string {
  // Extract the fixture type and number from patterns like T2_RA_WC_03
  const parts = fixtureId.split("_");
  if (parts.length >= 4) {
    return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
  }
  return fixtureId.replace(/^T2_/, "").replace(/_/g, " ");
}

/**
 * Get fixture display name with zone context.
 * e.g. "WC 03, Restroom A (Departure)"
 */
export function getFixtureDisplayName(fixtureId: string, zoneId: string): string {
  return `${getFixtureShortLabel(fixtureId)}, ${getZoneLabel(zoneId)}`;
}
