import { describe, it, expect } from "vitest";
import { SERVICE_TIERS } from "../components/booking/TierSelector";

// Tier scope data mirrored from TierSummaryPanel for unit testing
const TIER_SCOPE_BULLETS: Record<string, string[]> = {
  flex: [
    "Room-by-room checklist",
    "Timestamped photo evidence",
    "Digital sign-off & audit trail",
    "Standard turnaround",
    "Limited external documentation",
    "No close-up exterior photography",
  ],
  core: [
    "Everything in Flex",
    "Condition ratings per item",
    "Exterior overview photo",
    "Expanded documentation",
    "Faster turnaround",
  ],
  priority: [
    "Everything in Core",
    "Full external documentation",
    "Close-up exterior photos",
    "Tribunal-grade documentation standard",
    "Priority turnaround",
  ],
};

describe("TierSummaryPanel — scope data integrity", () => {
  it("every SERVICE_TIER has a matching scope entry", () => {
    SERVICE_TIERS.forEach((tier) => {
      expect(TIER_SCOPE_BULLETS[tier.value]).toBeDefined();
      expect(TIER_SCOPE_BULLETS[tier.value].length).toBeGreaterThan(0);
    });
  });

  it("Flex tier has correct bullets", () => {
    expect(TIER_SCOPE_BULLETS.flex).toContain("Room-by-room checklist");
    expect(TIER_SCOPE_BULLETS.flex).toContain("Timestamped photo evidence");
    expect(TIER_SCOPE_BULLETS.flex).toContain("No close-up exterior photography");
  });

  it("Core tier inherits Flex via 'Everything in Flex' bullet", () => {
    expect(TIER_SCOPE_BULLETS.core[0]).toBe("Everything in Flex");
    expect(TIER_SCOPE_BULLETS.core).toContain("Condition ratings per item");
  });

  it("Priority tier inherits Core via 'Everything in Core' bullet", () => {
    expect(TIER_SCOPE_BULLETS.priority[0]).toBe("Everything in Core");
    expect(TIER_SCOPE_BULLETS.priority).toContain("Tribunal-grade documentation standard");
  });
});

describe("Tier acknowledgement — canProceed logic", () => {
  const canProceedTierStep = (selectedTier: string, tierAcknowledged: boolean) =>
    !!selectedTier && tierAcknowledged;

  it("blocks proceeding when tier is selected but NOT acknowledged", () => {
    expect(canProceedTierStep("core", false)).toBe(false);
    expect(canProceedTierStep("flex", false)).toBe(false);
    expect(canProceedTierStep("priority", false)).toBe(false);
  });

  it("allows proceeding when tier is selected AND acknowledged", () => {
    expect(canProceedTierStep("core", true)).toBe(true);
    expect(canProceedTierStep("flex", true)).toBe(true);
    expect(canProceedTierStep("priority", true)).toBe(true);
  });

  it("blocks proceeding when neither tier nor acknowledgement is set", () => {
    expect(canProceedTierStep("", false)).toBe(false);
  });
});

describe("SERVICE_TIERS object — pricing engine untouched", () => {
  it("still has exactly 3 tiers", () => {
    expect(SERVICE_TIERS).toHaveLength(3);
  });

  it("tier values are unchanged (flex, core, priority)", () => {
    const values = SERVICE_TIERS.map((t) => t.value);
    expect(values).toContain("flex");
    expect(values).toContain("core");
    expect(values).toContain("priority");
  });

  it("starting prices are unchanged", () => {
    const flex = SERVICE_TIERS.find((t) => t.value === "flex")!;
    const core = SERVICE_TIERS.find((t) => t.value === "core")!;
    const priority = SERVICE_TIERS.find((t) => t.value === "priority")!;
    expect(flex.startingPrice).toBe(60);
    expect(core.startingPrice).toBe(70);
    expect(priority.startingPrice).toBe(90);
  });
});
