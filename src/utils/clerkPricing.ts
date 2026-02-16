/**
 * Clerk Payout Pricing
 * 
 * IMPORTANT: These values must NEVER be exposed to clients.
 * Only clerks see their own payout; admins see both client price + clerk pay.
 */

import { InspectionType } from "@/types/database";
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
