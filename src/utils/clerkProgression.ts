/**
 * Clerk Progression Engine
 * Level 1: Verified Clerk (Flex access)
 * Level 2: Professional Clerk (Core access)
 * Level 3: Assured Clerk (Priority access)
 */

import type { ServiceTier } from "@/components/booking/TierSelector";

export interface ClerkLevel {
  level: number;
  title: string;
  tierAccess: ServiceTier[];
  minJobsCompleted: number;
  minRating: number;
  badge: string;
  description: string;
}

export const CLERK_LEVELS: ClerkLevel[] = [
  {
    level: 1,
    title: "Verified Clerk",
    tierAccess: ["flex"],
    minJobsCompleted: 0,
    minRating: 0,
    badge: "🟢",
    description: "New to the platform. Access to Flex-tier jobs.",
  },
  {
    level: 2,
    title: "Professional Clerk",
    tierAccess: ["flex", "core"],
    minJobsCompleted: 10,
    minRating: 4.0,
    badge: "🔵",
    description: "Proven track record. Access to Flex and Core-tier jobs.",
  },
  {
    level: 3,
    title: "Assured Clerk",
    tierAccess: ["flex", "core", "priority"],
    minJobsCompleted: 30,
    minRating: 4.5,
    badge: "🟣",
    description: "Top-tier professional. Full access to all job tiers.",
  },
];

/**
 * Get the clerk's current level config based on their stats.
 */
export const getClerkLevel = (
  jobsCompleted: number,
  rating: number
): ClerkLevel => {
  // Check from highest level down
  for (let i = CLERK_LEVELS.length - 1; i >= 0; i--) {
    const level = CLERK_LEVELS[i];
    if (jobsCompleted >= level.minJobsCompleted && rating >= level.minRating) {
      return level;
    }
  }
  return CLERK_LEVELS[0];
};

/**
 * Get the next level requirements.
 */
export const getNextLevelRequirements = (
  currentLevel: number
): ClerkLevel | null => {
  const nextLevel = CLERK_LEVELS.find((l) => l.level === currentLevel + 1);
  return nextLevel || null;
};

/**
 * Check if a clerk can access a specific tier.
 */
export const canAccessTier = (
  clerkLevel: number,
  tier: ServiceTier
): boolean => {
  const levelConfig = CLERK_LEVELS.find((l) => l.level === clerkLevel);
  if (!levelConfig) return false;
  return levelConfig.tierAccess.includes(tier);
};

/**
 * Calculate progress to next level (0-100).
 */
export const getProgressToNextLevel = (
  currentLevel: number,
  jobsCompleted: number,
  rating: number
): { jobsProgress: number; ratingProgress: number; overall: number } => {
  const next = getNextLevelRequirements(currentLevel);
  if (!next) return { jobsProgress: 100, ratingProgress: 100, overall: 100 };

  const current = CLERK_LEVELS.find((l) => l.level === currentLevel)!;

  const jobsRange = next.minJobsCompleted - current.minJobsCompleted;
  const jobsDone = Math.min(jobsCompleted - current.minJobsCompleted, jobsRange);
  const jobsProgress = jobsRange > 0 ? Math.round((jobsDone / jobsRange) * 100) : 100;

  const ratingRange = next.minRating - current.minRating;
  const ratingDone = Math.min(rating - current.minRating, ratingRange);
  const ratingProgress = ratingRange > 0 ? Math.round((ratingDone / ratingRange) * 100) : 100;

  const overall = Math.round((jobsProgress + ratingProgress) / 2);

  return { jobsProgress, ratingProgress, overall };
};
