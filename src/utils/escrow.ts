/**
 * Escrow & Payout Calculation Utilities
 * Stripe-ready architecture — all amounts in GBP (pounds)
 */

// Platform fee percentage (visible to admin only)
export const PLATFORM_FEE_PERCENT = 0.15; // 15%

// Provider cut — reserved for future SaaS expansion. Not active in Phase 1.
export const PROVIDER_FEE_PERCENT = 0.10; // 10% of gross (inactive)

// Auto-release timer in hours
export const AUTO_RELEASE_HOURS = 48;

export interface PayoutBreakdown {
  grossAmount: number;
  platformFee: number;
  providerFee: number;
  clerkPayout: number;
}

/**
 * Calculate payout breakdown for a job.
 * Uses fixed clerk payout from clerkPricing.ts when provided.
 * Falls back to percentage-based calculation if no fixed payout given.
 * @param grossAmount - Total job price paid by client
 * @param hasProvider - Whether a provider is involved (takes a cut)
 * @param fixedClerkPayout - Optional fixed clerk payout from clerk pricing tables
 */
export const calculatePayoutBreakdown = (
  grossAmount: number,
  hasProvider: boolean = false,
  fixedClerkPayout?: number
): PayoutBreakdown => {
  const providerFee = hasProvider
    ? Math.round(grossAmount * PROVIDER_FEE_PERCENT * 100) / 100
    : 0;
  
  // Use fixed clerk payout if provided, otherwise calculate from percentage
  const clerkPayout = fixedClerkPayout !== undefined
    ? fixedClerkPayout
    : Math.round((grossAmount * (1 - PLATFORM_FEE_PERCENT) - providerFee) * 100) / 100;
  
  const platformFee = Math.round((grossAmount - clerkPayout - providerFee) * 100) / 100;

  return {
    grossAmount,
    platformFee,
    providerFee,
    clerkPayout,
  };
};

/**
 * Calculate cancellation fee based on timing.
 * - Before acceptance: no fee
 * - After acceptance, >24h before scheduled: 25% of quoted price
 * - After acceptance, <24h before scheduled: 50% of quoted price
 * - After inspection started: 100% of quoted price
 */
export const calculateCancellationFee = (
  quotedPrice: number,
  status: string,
  scheduledDate: string
): { fee: number; clerkPayout: number; reason: string } => {
  if (['draft', 'pending', 'published'].includes(status)) {
    return { fee: 0, clerkPayout: 0, reason: 'No fee — cancelled before acceptance' };
  }

  if (status === 'in_progress' || status === 'submitted') {
    return {
      fee: quotedPrice,
      clerkPayout: quotedPrice * 0.75,
      reason: 'Full fee — inspection already started',
    };
  }

  const hoursUntilScheduled =
    (new Date(scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilScheduled < 24) {
    return {
      fee: Math.round(quotedPrice * 0.5 * 100) / 100,
      clerkPayout: Math.round(quotedPrice * 0.35 * 100) / 100,
      reason: 'Late cancellation — less than 24 hours notice',
    };
  }

  return {
    fee: Math.round(quotedPrice * 0.25 * 100) / 100,
    clerkPayout: Math.round(quotedPrice * 0.15 * 100) / 100,
    reason: 'Early cancellation — more than 24 hours notice',
  };
};

/**
 * Calculate the auto-release timestamp (48 hours after hold).
 */
export const calculateAutoReleaseAt = (heldAt: Date = new Date()): Date => {
  return new Date(heldAt.getTime() + AUTO_RELEASE_HOURS * 60 * 60 * 1000);
};

export type EscrowStatus = 'pending' | 'held' | 'released' | 'refunded' | 'cancelled' | 'disputed';

export const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  pending: 'Pending',
  held: 'Held in Escrow',
  released: 'Released',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export const ESCROW_STATUS_COLORS: Record<EscrowStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  held: 'bg-warning/10 text-warning border-warning/30',
  released: 'bg-success/10 text-success border-success/30',
  refunded: 'bg-primary/10 text-primary border-primary/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  disputed: 'bg-destructive/10 text-destructive border-destructive/30',
};
