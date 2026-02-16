import { Property, InspectionType } from "@/types/database";

// ─── Tier type (duplicated here to avoid circular import) ───
export type ServiceTier = "flex" | "core" | "priority";

// ─── Constants ───
export const TIERED_SERVICES: InspectionType[] = ["new_inventory", "check_out"];
export const FURNISHING_SERVICES: InspectionType[] = ["new_inventory", "check_out"];
export const FURNISHED_SURCHARGE = 10;

const PROPERTY_SIZES = [
  "studio", "1_bed", "2_bed", "3_bed", "4_bed",
  "5_bed", "6_bed", "7_bed", "8_bed", "9_bed",
] as const;

// ─── Inventory pricing (unfurnished base) ───
const INVENTORY_PRICING: Record<ServiceTier, number[]> = {
  flex:     [60,  70,  85, 100, 120, 135, 150, 170, 185, 200],
  core:     [70,  90, 110, 130, 150, 170, 190, 210, 230, 250],
  priority: [90, 110, 130, 150, 170, 190, 220, 240, 260, 280],
};

// ─── Check-Out pricing (unfurnished base) ───
// ─── Check-Out pricing (unfurnished base) ───
const CHECKOUT_PRICING: Record<ServiceTier, number[]> = {
  flex:     [50,  60,  75,  90, 105, 130, 165, 175, 185, 195],
  core:     [60,  80, 100, 120, 140, 160, 180, 200, 230, 250],
  priority: [80, 100, 120, 140, 160, 180, 200, 230, 260, 280],
};

// ─── Check-In pricing (no tiers, no furnishing) ───
const CHECKIN_PRICING: number[] = [50, 50, 50, 50, 55, 55, 55, 60, 60, 60];

// ─── Interim — £50 flat for all sizes ───
const INTERIM_PRICING: number[] = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50];

// ─── Mid-Term — same as Interim ───
const MIDTERM_PRICING: number[] = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50];

// ─── Core price lookup ───

export const getServicePrice = (
  inspectionType: InspectionType,
  propertyType: string,
  tier: ServiceTier = "flex",
  isFurnished: boolean = false,
): number => {
  const idx = (PROPERTY_SIZES as readonly string[]).indexOf(propertyType);
  if (idx === -1) return 0;

  let base: number;
  switch (inspectionType) {
    case "new_inventory":
      base = INVENTORY_PRICING[tier]?.[idx] ?? 0;
      break;
    case "check_out":
      base = CHECKOUT_PRICING[tier]?.[idx] ?? 0;
      break;
    case "check_in":
      base = CHECKIN_PRICING[idx] ?? 0;
      break;
    case "interim":
      base = INTERIM_PRICING[idx] ?? 0;
      break;
    case "mid_term":
      base = MIDTERM_PRICING[idx] ?? 0;
      break;
    default:
      base = 0;
  }

  if (isFurnished && FURNISHING_SERVICES.includes(inspectionType)) {
    base += FURNISHED_SURCHARGE;
  }

  return base;
};

/** Whether this service requires a tier selection */
export const serviceRequiresTier = (type: InspectionType): boolean =>
  TIERED_SERVICES.includes(type);

/** Whether furnishing affects pricing for this service */
export const serviceUsesFurnishing = (type: InspectionType): boolean =>
  FURNISHING_SERVICES.includes(type);

// ─── Add-on pricing (per extra room beyond base inclusion) ───

export const ADD_ON_PRICES = {
  additionalKitchen: 20,
  additionalBathroom: 10,
  additionalLivingRoom: 15,
  diningArea: 15,
  hallwaysStairs: 10,
  utilityRoom: 10,
  storageRoom: 10,
  garden: 20,
  communalArea: 15,
  heavilyFurnished: 30,
};

// ─── Types ───

export interface ServicePrice {
  type: InspectionType;
  price: number;
}

export interface AddOnItem {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PriceBreakdown {
  services: ServicePrice[];
  servicesTotal: number;
  addOns: AddOnItem[];
  addOnsTotal: number;
  total: number;
}

// ─── Full breakdown (used in BookingSummary) ───

export const calculatePriceBreakdown = (
  property: Property | null,
  inspectionTypes: InspectionType[],
  tier: ServiceTier = "flex",
): PriceBreakdown => {
  if (!property || inspectionTypes.length === 0) {
    return { services: [], servicesTotal: 0, addOns: [], addOnsTotal: 0, total: 0 };
  }

  const isFurnished = property.furnished_status === "furnished";

  const services: ServicePrice[] = inspectionTypes.map((type) => ({
    type,
    price: getServicePrice(type, property.property_type, tier, isFurnished),
  }));

  const servicesTotal = services.reduce((sum, s) => sum + s.price, 0);

  // Add-ons for extra rooms
  const addOns: AddOnItem[] = [];

  const push = (label: string, quantity: number, unitPrice: number) => {
    if (quantity > 0) addOns.push({ label, quantity, unitPrice, total: quantity * unitPrice });
  };

  push("Additional Kitchen", Math.max(0, property.kitchens - 1), ADD_ON_PRICES.additionalKitchen);
  push("Additional Bathroom / WC", Math.max(0, property.bathrooms - 1), ADD_ON_PRICES.additionalBathroom);
  push("Additional Living Room", Math.max(0, property.living_rooms - 1), ADD_ON_PRICES.additionalLivingRoom);
  push("Dining Area", property.dining_areas, ADD_ON_PRICES.diningArea);
  push("Hallways, Landings & Stairs", property.hallways_stairs, ADD_ON_PRICES.hallwaysStairs);
  push("Utility Room", property.utility_rooms, ADD_ON_PRICES.utilityRoom);
  push("Storage Room", property.storage_rooms, ADD_ON_PRICES.storageRoom);
  push("Garden / Outdoor Space", property.gardens, ADD_ON_PRICES.garden);
  push("Communal Area", property.communal_areas, ADD_ON_PRICES.communalArea);
  if (property.heavily_furnished) {
    push("Heavily Furnished Surcharge", 1, ADD_ON_PRICES.heavilyFurnished);
  }

  const addOnsTotal = addOns.reduce((sum, a) => sum + a.total, 0);

  return { services, servicesTotal, addOns, addOnsTotal, total: servicesTotal + addOnsTotal };
};

// ─── Simple total ───

export const calculateJobPrice = (
  property: Property | null,
  inspectionTypes: InspectionType[],
  tier: ServiceTier = "flex",
): number => {
  return calculatePriceBreakdown(property, inspectionTypes, tier).total;
};

// ─── Estimate from form (used in PropertyPricingPreview) ───

export const calculateEstimateFromForm = (
  propertyType: string,
  furnishedStatus: string,
  rooms: {
    kitchens: number;
    bathrooms: number;
    living_rooms: number;
    dining_areas: number;
    hallways_stairs: number;
    utility_rooms: number;
    storage_rooms: number;
    gardens: number;
    communal_areas: number;
  },
  heavilyFurnished: boolean,
): {
  perService: Record<InspectionType, Record<ServiceTier, number>>;
  addOns: AddOnItem[];
  addOnsTotal: number;
} => {
  const isFurnished = furnishedStatus === "furnished";
  const tiers: ServiceTier[] = ["flex", "core", "priority"];
  const inspectionTypes: InspectionType[] = ["new_inventory", "check_in", "check_out", "mid_term", "interim"];

  const perService = {} as Record<InspectionType, Record<ServiceTier, number>>;
  for (const type of inspectionTypes) {
    perService[type] = {} as Record<ServiceTier, number>;
    for (const tier of tiers) {
      perService[type][tier] = getServicePrice(type, propertyType, tier, isFurnished);
    }
  }

  const addOns: AddOnItem[] = [];
  const push = (label: string, qty: number, unit: number) => {
    if (qty > 0) addOns.push({ label, quantity: qty, unitPrice: unit, total: qty * unit });
  };

  push("Additional Kitchen", Math.max(0, rooms.kitchens - 1), ADD_ON_PRICES.additionalKitchen);
  push("Additional Bathroom / WC", Math.max(0, rooms.bathrooms - 1), ADD_ON_PRICES.additionalBathroom);
  push("Additional Living Room", Math.max(0, rooms.living_rooms - 1), ADD_ON_PRICES.additionalLivingRoom);
  push("Dining Area", rooms.dining_areas, ADD_ON_PRICES.diningArea);
  push("Hallways & Stairs", rooms.hallways_stairs, ADD_ON_PRICES.hallwaysStairs);
  push("Utility Room", rooms.utility_rooms, ADD_ON_PRICES.utilityRoom);
  push("Storage Room", rooms.storage_rooms, ADD_ON_PRICES.storageRoom);
  push("Garden / Outdoor", rooms.gardens, ADD_ON_PRICES.garden);
  push("Communal Area", rooms.communal_areas, ADD_ON_PRICES.communalArea);
  if (heavilyFurnished) push("Heavily Furnished", 1, ADD_ON_PRICES.heavilyFurnished);

  const addOnsTotal = addOns.reduce((sum, a) => sum + a.total, 0);

  return { perService, addOns, addOnsTotal };
};
