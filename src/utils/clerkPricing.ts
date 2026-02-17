/**
 * Clerk Payout Pricing
 * 
 * IMPORTANT: These values must NEVER be exposed to clients.
 * Only clerks see their own payout; admins see both client price + clerk pay.
 */

import { InspectionType, Property } from "@/types/database";
import type { ServiceTier } from "./pricing";

// ─── Inventory clerk pay (unfurnished base) ───
const INVENTORY_CLERK_PAY: number[] = [25, 30, 35, 40, 45, 55, 75, 85, 95, 110];

// ─── Check-Out clerk pay ───
const CHECKOUT_CLERK_PAY: number[] = [25, 30, 35, 40, 45, 50, 65, 75, 85, 100];

// ─── Check-In clerk pay (flat) ───
const CHECKIN_CLERK_PAY: number[] = [20, 20, 20, 20, 20, 20, 20, 20, 20, 20];

// ─── Interim clerk pay (flat) ───
const INTERIM_CLERK_PAY: number[] = [25, 25, 25, 25, 25, 25, 25, 25, 25, 25];

// ─── Mid-Term clerk pay (same as interim) ───
const MIDTERM_CLERK_PAY: number[] = [25, 25, 25, 25, 25, 25, 25, 25, 25, 25];

const PROPERTY_SIZES = [
  "studio", "1_bed", "2_bed", "3_bed", "4_bed",
  "5_bed", "6_bed", "7_bed", "8_bed", "9_bed",
] as const;

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
  heavilyFurnished: 15,
};

/**
 * Get the clerk payout for a job.
 * Clerk pay does NOT vary by tier — it's always a fixed amount per service/size.
 */
export const getClerkPayout = (
  inspectionType: InspectionType,
  propertyType: string,
): number => {
  const idx = (PROPERTY_SIZES as readonly string[]).indexOf(propertyType);
  if (idx === -1) return 0;

  switch (inspectionType) {
    case "new_inventory":
      return INVENTORY_CLERK_PAY[idx] ?? 0;
    case "check_out":
      return CHECKOUT_CLERK_PAY[idx] ?? 0;
    case "check_in":
      return CHECKIN_CLERK_PAY[idx] ?? 0;
    case "interim":
      return INTERIM_CLERK_PAY[idx] ?? 0;
    case "mid_term":
      return MIDTERM_CLERK_PAY[idx] ?? 0;
    default:
      return 0;
  }
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
  const baseBedrooms = PROPERTY_SIZES.indexOf(property.property_type as any);
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

/**
 * Get total clerk payout including base + add-ons from property.
 */
export const getFullClerkPayout = (
  inspectionType: InspectionType,
  propertyType: string,
  property: Property | null,
): { base: number; addOns: ClerkAddOnItem[]; addOnsTotal: number; total: number } => {
  const base = getClerkPayout(inspectionType, propertyType);
  const addOns = calculateClerkAddOns(property);
  const addOnsTotal = addOns.reduce((sum, a) => sum + a.total, 0);
  return { base, addOns, addOnsTotal, total: base + addOnsTotal };
};

/**
 * Calculate aborted visit payout (50% of base clerk job pay).
 */
export const calculateAbortedVisitPayout = (
  inspectionType: InspectionType,
  propertyType: string,
): number => {
  const base = getClerkPayout(inspectionType, propertyType);
  return Math.round((base * 0.5) * 100) / 100;
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
