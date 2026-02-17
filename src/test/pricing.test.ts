import { describe, it, expect } from "vitest";
import { getServicePrice } from "@/utils/pricing";
import { getClerkPayout, calculateMargin, calculateFinalClerkPayout } from "@/utils/clerkPricing";

describe("Pricing and Clerk Payout Calculations", () => {
  describe("Client pricing", () => {
    it("returns correct flex inventory price for 2_bed", () => {
      expect(getServicePrice("new_inventory", "2_bed", "flex", "unfurnished")).toBe(85);
    });

    it("returns correct core inventory price for 3_bed", () => {
      expect(getServicePrice("new_inventory", "3_bed", "core", "unfurnished")).toBe(130);
    });

    it("adds furnished surcharge for inventory", () => {
      const unfurnished = getServicePrice("new_inventory", "2_bed", "flex", "unfurnished");
      const furnished = getServicePrice("new_inventory", "2_bed", "flex", "furnished");
      expect(furnished - unfurnished).toBe(10);
    });

    it("adds part_furnished surcharge for inventory", () => {
      const unfurnished = getServicePrice("new_inventory", "2_bed", "flex", "unfurnished");
      const partFurnished = getServicePrice("new_inventory", "2_bed", "flex", "part_furnished");
      expect(partFurnished - unfurnished).toBe(5);
    });

    it("check_in is flat pricing regardless of tier", () => {
      const flex = getServicePrice("check_in", "3_bed", "flex");
      const core = getServicePrice("check_in", "3_bed", "core");
      const priority = getServicePrice("check_in", "3_bed", "priority");
      expect(flex).toBe(50);
      expect(core).toBe(50);
      expect(priority).toBe(50);
    });
  });

  describe("Clerk payout", () => {
    it("returns correct inventory clerk pay for 2_bed", () => {
      expect(getClerkPayout("new_inventory", "2_bed")).toBe(35);
    });

    it("returns correct check_out clerk pay for 4_bed", () => {
      expect(getClerkPayout("check_out", "4_bed")).toBe(45);
    });

    it("check_in clerk pay is flat £20", () => {
      expect(getClerkPayout("check_in", "studio")).toBe(20);
      expect(getClerkPayout("check_in", "9_bed")).toBe(20);
    });

    it("returns 0 for invalid property type", () => {
      expect(getClerkPayout("new_inventory", "invalid")).toBe(0);
    });
  });

  describe("Margin calculation", () => {
    it("calculates margin as client price minus clerk pay", () => {
      const clientPrice = getServicePrice("new_inventory", "2_bed", "flex", "unfurnished"); // 85
      const clerkPay = getClerkPayout("new_inventory", "2_bed"); // 35
      const margin = calculateMargin(clientPrice, clerkPay);
      expect(margin).toBe(50);
    });

    it("margin varies by tier", () => {
      const clerkPay = getClerkPayout("new_inventory", "3_bed"); // 40
      const flexMargin = calculateMargin(getServicePrice("new_inventory", "3_bed", "flex"), clerkPay);
      const coreMargin = calculateMargin(getServicePrice("new_inventory", "3_bed", "core"), clerkPay);
      const priorityMargin = calculateMargin(getServicePrice("new_inventory", "3_bed", "priority"), clerkPay);
      
      expect(flexMargin).toBe(60);  // 100 - 40
      expect(coreMargin).toBe(90);  // 130 - 40
      expect(priorityMargin).toBe(110); // 150 - 40
    });
  });

  describe("Final payout with bonus", () => {
    it("adds bonus to base payout", () => {
      expect(calculateFinalClerkPayout(35, 10)).toBe(45);
    });

    it("works with zero bonus", () => {
      expect(calculateFinalClerkPayout(35, 0)).toBe(35);
      expect(calculateFinalClerkPayout(35)).toBe(35);
    });
  });

  describe("End-to-end job creation scenario", () => {
    it("2_bed flex inventory: client=85, clerk=35, margin=50", () => {
      const clientPrice = getServicePrice("new_inventory", "2_bed", "flex", "unfurnished");
      const clerkPay = getClerkPayout("new_inventory", "2_bed");
      const margin = calculateMargin(clientPrice, clerkPay);

      expect(clientPrice).toBe(85);
      expect(clerkPay).toBe(35);
      expect(margin).toBe(50);
    });

    it("4_bed priority check_out furnished: client=170, clerk=45, margin=125", () => {
      const clientPrice = getServicePrice("check_out", "4_bed", "priority", "furnished");
      const clerkPay = getClerkPayout("check_out", "4_bed");
      const margin = calculateMargin(clientPrice, clerkPay);

      expect(clientPrice).toBe(170); // 160 + 10 surcharge
      expect(clerkPay).toBe(45);
      expect(margin).toBe(125);
    });

    it("with bonus applied: clerk final = base + bonus, margin adjusts", () => {
      const clientPrice = getServicePrice("new_inventory", "3_bed", "core", "unfurnished"); // 130
      const clerkPay = getClerkPayout("new_inventory", "3_bed"); // 40
      const bonus = 15;
      const finalPayout = calculateFinalClerkPayout(clerkPay, bonus); // 55
      const adjustedMargin = clientPrice - finalPayout; // 75

      expect(finalPayout).toBe(55);
      expect(adjustedMargin).toBe(75);
    });
  });
});
