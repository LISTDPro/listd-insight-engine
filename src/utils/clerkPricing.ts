/**
 * Clerk Payout Pricing
 * 
 * IMPORTANT: These values must NEVER be exposed to clients.
 * Only clerks see their own payout; admins see both client price + clerk pay.
 * 
 * Single master configuration — all clerk payouts live here.
 */

import { InspectionType, Property } from "@/types/database";
import type { ServiceTier } from "./pricing";

// ─── Property size index ───
const PROPERTY_SIZES = [
  "studio", "1_bed", "2_bed", "3_bed", "4_bed",
  "5_bed", "6_bed", "7_bed", "8_bed", "9_bed",
] as const;

type PropertySize = (typeof PROPERTY_SIZES)[number];

// ─── Master Clerk Payout Configuration ───
// Tiered arrays: index maps to PROPERTY_SIZES
// Flat services: single value per tier
const CLERK_PAYOUT_CONFIG: Record<
  InspectionType,
  Record<ServiceTier, number[] | number>
> = {
  new_inventory: {
    flex:     [25, 30, 35, 40, 45, 55, 75, 85, 95, 110],
    core:     [25, 30, 35, 40, 45, 55, 75, 85, 95, 110],
    priority: [25, 30, 35, 40, 45, 55, 75, 85, 95, 110],
  },
  check_out: {
    flex:     [25, 30, 35, 40, 45, 50, 65, 75, 85, 100],
    core:     [25, 30, 35, 40, 45, 50, 65, 75, 85, 100],
    priority: [25, 30, 35, 40, 45, 50, 65, 75, 85, 100],
  },
  check_in: { flex: 20, core: 20, priority: 20 },
  interim:  { flex: 25, core: 25, priority: 25 },
  mid_term: { flex: 25, core: 25, priority: 25 },
};

// ─── Clerk Add-On Rates (per extra room beyond base) ───
export const CLERK_ADD_ON_PRICES = {
  additionalBedroom: 5,
  additionalKitchen: 10,
  additionalBathroom: 5,
  additionalLivingRoom: 7.5,
  additionalDiningArea: 5,
  hallwaysStairs: 5,
  utilityRoom: 5,
  storageRoom: 5,
  garden: 10,
  communalArea: 5,
  heavilyFurnished: 5,
};

// ─── Helpers ───

function getSizeIndex(propertyType: string): number {
  const idx = (PROPERTY_SIZES as readonly string[]).indexOf(propertyType);
  if (idx === -1) {
    throw new Error(`Unknown property size: "${propertyType}". Valid sizes: ${PROPERTY_SIZES.join(", ")}`);
  }
  return idx;
}

function resolveTier(tier?: string): ServiceTier {
  if (!tier || !["flex", "core", "priority"].includes(tier)) {
    return "flex"; // default tier
  }
  return tier as ServiceTier;
}

// ─── Public API ───

/**
 * Get the base clerk payout for a job.
 * Throws if property size is invalid — never returns silent £0.
 */
export const getClerkPayout = (
  inspectionType: InspectionType,
  propertyType: string,
  tier?: string,
): number => {
  const resolvedTier = resolveTier(tier);
  const config = CLERK_PAYOUT_CONFIG[inspectionType];

  if (!config) {
    throw new Error(`Unknown inspection type: "${inspectionType}"`);
  }

  const tierConfig = config[resolvedTier];

  if (typeof tierConfig === "number") {
    // Flat rate service (check_in, interim, mid_term) — size doesn't matter
    return tierConfig;
  }

  // Array-based service — look up by size index
  const idx = getSizeIndex(propertyType);
  const value = tierConfig[idx];
  if (value === undefined) {
    throw new Error(`No clerk payout for ${inspectionType} / ${propertyType} / ${resolvedTier}`);
  }
  return value;
};

/**
 * Calculate clerk add-on pay from property room counts.
 * Base includes: 1 Kitchen, 1 Bathroom, 1 Living Room.
 */
export interface ClerkAddOnItem {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const calculateClerkAddOns = (property: Property | null): ClerkAddOnItem[] => {
  if (!property) return [];

  const addOns: ClerkAddOnItem[] = [];

  // Extra bedrooms beyond property type
  const baseBedrooms = (PROPERTY_SIZES as readonly string[]).indexOf(property.property_type as string);
  const extraBedrooms = Math.max(0, (property.bedrooms ?? baseBedrooms) - Math.max(baseBedrooms, 0));
  if (extraBedrooms > 0) {
    addOns.push({ label: "Additional Bedroom", quantity: extraBedrooms, unitPrice: CLERK_ADD_ON_PRICES.additionalBedroom, total: extraBedrooms * CLERK_ADD_ON_PRICES.additionalBedroom });
  }

  const extraKitchens = Math.max(0, (property.kitchens ?? 1) - 1);
  if (extraKitchens > 0) {
    addOns.push({ label: "Additional Kitchen", quantity: extraKitchens, unitPrice: CLERK_ADD_ON_PRICES.additionalKitchen, total: extraKitchens * CLERK_ADD_ON_PRICES.additionalKitchen });
  }

  const extraBathrooms = Math.max(0, (property.bathrooms ?? 1) - 1);
  if (extraBathrooms > 0) {
    addOns.push({ label: "Additional Bathroom / WC", quantity: extraBathrooms, unitPrice: CLERK_ADD_ON_PRICES.additionalBathroom, total: extraBathrooms * CLERK_ADD_ON_PRICES.additionalBathroom });
  }

  const extraLivingRooms = Math.max(0, (property.living_rooms ?? 1) - 1);
  if (extraLivingRooms > 0) {
    addOns.push({ label: "Communal Lounge / Living Room", quantity: extraLivingRooms, unitPrice: CLERK_ADD_ON_PRICES.additionalLivingRoom, total: extraLivingRooms * CLERK_ADD_ON_PRICES.additionalLivingRoom });
  }

  const extraHallways = Math.max(0, (property.hallways_stairs ?? 1) - 1);
  if (extraHallways > 0) {
    addOns.push({ label: "Hallways / Landings / Stairs", quantity: extraHallways, unitPrice: CLERK_ADD_ON_PRICES.hallwaysStairs, total: extraHallways * CLERK_ADD_ON_PRICES.hallwaysStairs });
  }

  const extraDining = Math.max(0, (property.dining_areas ?? 1) - 1);
  if (extraDining > 0) {
    addOns.push({ label: "Additional Dining Area", quantity: extraDining, unitPrice: CLERK_ADD_ON_PRICES.additionalDiningArea, total: extraDining * CLERK_ADD_ON_PRICES.additionalDiningArea });
  }

  const extraUtility = Math.max(0, (property.utility_rooms ?? 1) - 1);
  if (extraUtility > 0) {
    addOns.push({ label: "Utility Room", quantity: extraUtility, unitPrice: CLERK_ADD_ON_PRICES.utilityRoom, total: extraUtility * CLERK_ADD_ON_PRICES.utilityRoom });
  }

  const extraStorage = Math.max(0, (property.storage_rooms ?? 1) - 1);
  if (extraStorage > 0) {
    addOns.push({ label: "Storage Room", quantity: extraStorage, unitPrice: CLERK_ADD_ON_PRICES.storageRoom, total: extraStorage * CLERK_ADD_ON_PRICES.storageRoom });
  }

  const extraGardens = Math.max(0, (property.gardens ?? 1) - 1);
  if (extraGardens > 0) {
    addOns.push({ label: "Garden / Outdoor Space", quantity: extraGardens, unitPrice: CLERK_ADD_ON_PRICES.garden, total: extraGardens * CLERK_ADD_ON_PRICES.garden });
  }

  const extraCommunal = Math.max(0, (property.communal_areas ?? 1) - 1);
  if (extraCommunal > 0) {
    addOns.push({ label: "Communal Area", quantity: extraCommunal, unitPrice: CLERK_ADD_ON_PRICES.communalArea, total: extraCommunal * CLERK_ADD_ON_PRICES.communalArea });
  }

  if (property.heavily_furnished) {
    addOns.push({ label: "Heavily Furnished Property", quantity: 1, unitPrice: CLERK_ADD_ON_PRICES.heavilyFurnished, total: CLERK_ADD_ON_PRICES.heavilyFurnished });
  }

  return addOns;
};

export interface FullClerkPayoutResult {
  base: number;
  addOns: ClerkAddOnItem[];
  addOnsTotal: number;
  total: number;
  tier: string;
  size: string;
  inspectionType: string;
}

/**
 * Get total clerk payout including base + add-ons from property.
 * Returns a storable breakdown object.
 */
export const getFullClerkPayout = (
  inspectionType: InspectionType,
  propertyType: string,
  property: Property | null,
  tier?: string,
): FullClerkPayoutResult => {
  const resolvedTier = resolveTier(tier);
  const base = getClerkPayout(inspectionType, propertyType, resolvedTier);
  const addOns = calculateClerkAddOns(property);
  const addOnsTotal = addOns.reduce((sum, a) => sum + a.total, 0);
  return {
    base,
    addOns,
    addOnsTotal,
    total: base + addOnsTotal,
    tier: resolvedTier,
    size: propertyType,
    inspectionType,
  };
};

/**
 * Calculate aborted visit payout: (base + addOns) / 2
 */
export const calculateAbortedVisitPayout = (
  inspectionType: InspectionType,
  propertyType: string,
  property: Property | null = null,
  tier?: string,
): number => {
  const { total } = getFullClerkPayout(inspectionType, propertyType, property, tier);
  return Math.round(total * 0.5 * 100) / 100;
};

/**
 * Calculate margin (admin-only).
 * Margin = Client Price − Clerk Pay
 */
export const calculateMargin = (
  clientPrice: number,
  clerkPayout: number,
): number => {
  return Math.round((clientPrice - clerkPayout) * 100) / 100;
};

/**
 * Calculate final clerk payout including any bonus.
 */
export const calculateFinalClerkPayout = (
  basePayout: number,
  bonus: number = 0,
): number => {
  return Math.round((basePayout + bonus) * 100) / 100;
};

// ─── Bundle Support ───

export interface BundleServiceBreakdown {
  type: string;
  base: number;
  addOns: ClerkAddOnItem[];
  addOnsTotal: number;
  total: number;
}

export interface BundleClerkPayoutResult {
  services: BundleServiceBreakdown[];
  grandTotal: number;
  tier: string;
  size: string;
}

/**
 * Calculate clerk payout for a bundle of services.
 * Decomposes into per-service breakdowns with a grand total.
 */
export const calculateBundleClerkPayout = (
  inspectionTypes: InspectionType[],
  propertyType: string,
  property: Property | null,
  tier?: string,
): BundleClerkPayoutResult => {
  const resolvedTier = resolveTier(tier);
  const services: BundleServiceBreakdown[] = inspectionTypes.map((type) => {
    const result = getFullClerkPayout(type, propertyType, property, resolvedTier);
    return {
      type,
      base: result.base,
      addOns: result.addOns,
      addOnsTotal: result.addOnsTotal,
      total: result.total,
    };
  });

  return {
    services,
    grandTotal: services.reduce((sum, s) => sum + s.total, 0),
    tier: resolvedTier,
    size: propertyType,
  };
};
