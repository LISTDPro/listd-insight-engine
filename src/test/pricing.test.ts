import { describe, it, expect } from "vitest";
import { getServicePrice } from "@/utils/pricing";
import {
  getClerkPayout,
  calculateMargin,
  calculateFinalClerkPayout,
  calculateClerkAddOns,
  getFullClerkPayout,
  calculateAbortedVisitPayout,
  calculateBundleClerkPayout,
  CLERK_ADD_ON_PRICES,
} from "@/utils/clerkPricing";

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

  describe("Clerk payout (with tier)", () => {
    it("returns correct inventory clerk pay for 2_bed flex", () => {
      expect(getClerkPayout("new_inventory", "2_bed", "flex")).toBe(35);
    });

    it("returns correct inventory clerk pay for 2_bed core", () => {
      expect(getClerkPayout("new_inventory", "2_bed", "core")).toBe(35);
    });

    it("returns correct inventory clerk pay for 2_bed priority", () => {
      expect(getClerkPayout("new_inventory", "2_bed", "priority")).toBe(35);
    });

    it("returns correct check_out clerk pay for 4_bed", () => {
      expect(getClerkPayout("check_out", "4_bed", "flex")).toBe(45);
    });

    it("check_in clerk pay is flat £20", () => {
      expect(getClerkPayout("check_in", "studio", "flex")).toBe(20);
      expect(getClerkPayout("check_in", "9_bed", "priority")).toBe(20);
    });

    it("interim clerk pay is flat £25", () => {
      expect(getClerkPayout("interim", "studio", "flex")).toBe(25);
    });

    it("mid_term clerk pay is flat £25", () => {
      expect(getClerkPayout("mid_term", "3_bed", "core")).toBe(25);
    });

    it("defaults to flex tier when no tier provided", () => {
      expect(getClerkPayout("new_inventory", "2_bed")).toBe(35);
    });

    it("throws for invalid property type", () => {
      expect(() => getClerkPayout("new_inventory", "invalid")).toThrow("Unknown property size");
    });

    it("throws for invalid inspection type", () => {
      expect(() => getClerkPayout("invalid_type" as any, "2_bed")).toThrow("Unknown inspection type");
    });
  });

  describe("Margin calculation", () => {
    it("calculates margin as client price minus clerk pay", () => {
      const clientPrice = getServicePrice("new_inventory", "2_bed", "flex", "unfurnished"); // 85
      const clerkPay = getClerkPayout("new_inventory", "2_bed", "flex"); // 35
      const margin = calculateMargin(clientPrice, clerkPay);
      expect(margin).toBe(50);
    });

    it("margin varies by tier", () => {
      const clerkPay = getClerkPayout("new_inventory", "3_bed", "flex"); // 40
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

  describe("Clerk Add-Ons", () => {
    it("heavily furnished add-on is £5", () => {
      expect(CLERK_ADD_ON_PRICES.heavilyFurnished).toBe(5);
    });

    it("returns empty array for null property", () => {
      expect(calculateClerkAddOns(null)).toEqual([]);
    });
  });

  describe("Full clerk payout with add-ons", () => {
    it("includes tier and inspectionType in result", () => {
      const result = getFullClerkPayout("new_inventory", "2_bed", null, "core");
      expect(result.tier).toBe("core");
      expect(result.inspectionType).toBe("new_inventory");
      expect(result.size).toBe("2_bed");
      expect(result.base).toBe(35);
      expect(result.total).toBe(35); // no add-ons with null property
    });
  });

  describe("Aborted visit payout", () => {
    it("equals (base + addOns) / 2 with no property", () => {
      const payout = calculateAbortedVisitPayout("new_inventory", "2_bed", null, "flex");
      expect(payout).toBe(17.5); // 35 / 2
    });

    it("equals (base + addOns) / 2 with property add-ons", () => {
      const mockProperty = {
        id: "test",
        client_id: "test",
        address_line_1: "Test",
        city: "London",
        postcode: "SW1",
        property_type: "2_bed" as any,
        bedrooms: 2,
        bathrooms: 2, // 1 extra = £5
        kitchens: 1,
        living_rooms: 1,
        dining_areas: 0,
        hallways_stairs: 1,
        utility_rooms: 0,
        storage_rooms: 0,
        gardens: 0,
        communal_areas: 0,
        heavily_furnished: false,
        furnished_status: "unfurnished" as any,
        created_at: "",
        updated_at: "",
        organisation_id: null,
        notes: null,
        address_line_2: null,
      };
      const payout = calculateAbortedVisitPayout("new_inventory", "2_bed", mockProperty, "flex");
      // base=35, addOns=5 (1 extra bathroom), total=40, aborted=20
      expect(payout).toBe(20);
    });
  });

  describe("Bundle clerk payout", () => {
    it("decomposes inventory + checkout into per-service breakdown", () => {
      const result = calculateBundleClerkPayout(
        ["new_inventory", "check_out"],
        "2_bed",
        null,
        "core",
      );
      expect(result.services).toHaveLength(2);
      expect(result.services[0].type).toBe("new_inventory");
      expect(result.services[0].base).toBe(35);
      expect(result.services[1].type).toBe("check_out");
      expect(result.services[1].base).toBe(35);
      expect(result.grandTotal).toBe(70);
      expect(result.tier).toBe("core");
      expect(result.size).toBe("2_bed");
    });

    it("throws if any service has invalid property type", () => {
      expect(() =>
        calculateBundleClerkPayout(["new_inventory", "check_out"], "invalid", null, "flex"),
      ).toThrow("Unknown property size");
    });
  });

  describe("End-to-end job creation scenario", () => {
    it("2_bed flex inventory: client=85, clerk=35, margin=50", () => {
      const clientPrice = getServicePrice("new_inventory", "2_bed", "flex", "unfurnished");
      const clerkPay = getClerkPayout("new_inventory", "2_bed", "flex");
      const margin = calculateMargin(clientPrice, clerkPay);

      expect(clientPrice).toBe(85);
      expect(clerkPay).toBe(35);
      expect(margin).toBe(50);
    });

    it("4_bed priority check_out furnished: client=170, clerk=45, margin=125", () => {
      const clientPrice = getServicePrice("check_out", "4_bed", "priority", "furnished");
      const clerkPay = getClerkPayout("check_out", "4_bed", "priority");
      const margin = calculateMargin(clientPrice, clerkPay);

      expect(clientPrice).toBe(170); // 160 + 10 surcharge
      expect(clerkPay).toBe(45);
      expect(margin).toBe(125);
    });

    it("with bonus applied: clerk final = base + bonus, margin adjusts", () => {
      const clientPrice = getServicePrice("new_inventory", "3_bed", "core", "unfurnished"); // 130
      const clerkPay = getClerkPayout("new_inventory", "3_bed", "core"); // 40
      const bonus = 15;
      const finalPayout = calculateFinalClerkPayout(clerkPay, bonus); // 55
      const adjustedMargin = clientPrice - finalPayout; // 75

      expect(finalPayout).toBe(55);
      expect(adjustedMargin).toBe(75);
    });
  });
});
