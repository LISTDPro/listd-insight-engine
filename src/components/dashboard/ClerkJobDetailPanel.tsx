import { Check, Building, Layers, Clock, User, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_TIERS, ServiceTier } from "@/components/booking/TierSelector";
import { INSPECTION_TYPE_LABELS, PROPERTY_TYPE_LABELS, FURNISHED_STATUS_LABELS, PropertyType, FurnishedStatus } from "@/types/database";
import TierBadge from "@/components/ui/tier-badge";
import { Badge } from "@/components/ui/badge";
import { JobWithDetails } from "@/hooks/useJobDetail";
import { format } from "date-fns";
import PayoutBreakdown from "./PayoutBreakdown";

interface TenantDetail {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  tenant_order: number;
}

interface ClerkJobDetailPanelProps {
  job: JobWithDetails & {
    property?: {
      address_line_1: string;
      address_line_2: string | null;
      city: string;
      postcode: string;
      property_type: string;
      bedrooms: number;
      bathrooms: number;
      kitchens?: number;
      living_rooms?: number;
      hallways_stairs?: number;
      gardens?: number;
      utility_rooms?: number;
      storage_rooms?: number;
      communal_areas?: number;
      furnished_status?: string;
    };
  };
  tenantDetails?: TenantDetail[];
}

// Turnaround label per tier
const TURNAROUND_LABELS: Record<ServiceTier, string> = {
  flex: "Standard",
  core: "Faster",
  priority: "Priority",
};

// Scope bullets per tier (no pricing)
const TIER_SCOPE_BULLETS: Record<ServiceTier, string[]> = {
  flex: [
    "Room-by-room checklist",
    "Timestamped photo evidence",
    "Digital sign-off & audit trail",
    "Standard turnaround",
    "No close-up exterior photography",
  ],
  core: [
    "Everything in Flex",
    "Condition ratings per item",
    "One landscape exterior image",
    "Exterior description included",
    "Faster delivery window",
  ],
  priority: [
    "Everything in Core",
    "Full external documentation",
    "Close-up exterior photos",
    "Tribunal-grade evidence standard",
    "Priority turnaround",
  ],
};

const LEGACY_TIER_MAP: Record<string, ServiceTier> = {
  standard: "flex",
  premium: "priority",
};

function resolveServiceTier(tier: string | null | undefined): ServiceTier {
  if (!tier) return "flex";
  if (LEGACY_TIER_MAP[tier]) return LEGACY_TIER_MAP[tier];
  if (["flex", "core", "priority"].includes(tier)) return tier as ServiceTier;
  return "flex";
}

/** Parse bundled services from clerk_payout_breakdown or special_instructions */
function parseBundledServices(job: any): string[] {
  const breakdown = job.clerk_payout_breakdown;
  
  // Check breakdown for bundle info
  if (breakdown && typeof breakdown === "object" && breakdown.bundle === true && Array.isArray(breakdown.services)) {
    return breakdown.services.map((s: any) => s.type as string);
  }

  // Fallback: parse special_instructions for "[Additional services: ...]"
  const instructions = job.special_instructions || "";
  const match = instructions.match(/\[Additional services:\s*(.+?)\]/);
  if (match) {
    const additionalTypes = match[1].split(",").map((s: string) => s.trim());
    return [job.inspection_type, ...additionalTypes];
  }

  return [job.inspection_type];
}

/** Get clerk payout from breakdown or fall back to clerk_payout */
function getClerkPayoutDisplay(job: any): number | null {
  if (job.clerk_payout != null && job.clerk_payout > 0) return job.clerk_payout;
  if (job.clerk_final_payout != null && job.clerk_final_payout > 0) return job.clerk_final_payout;
  return null;
}

const ClerkJobDetailPanel = ({ job, tenantDetails = [] }: ClerkJobDetailPanelProps) => {
  const tier = resolveServiceTier(job.service_tier);
  const tierConfig = SERVICE_TIERS.find((t) => t.value === tier)!;
  const TierIcon = tierConfig.icon;
  const bullets = TIER_SCOPE_BULLETS[tier];
  const property = job.property;

  const bundledServices = parseBundledServices(job);
  const isBundle = bundledServices.length > 1;
  const clerkPayout = getClerkPayoutDisplay(job);

  // Build included areas list from property data
  const includedAreas: string[] = [];
  if (property) {
    const beds = property.bedrooms ?? 0;
    if (beds > 0) includedAreas.push(`${beds} Bedroom${beds > 1 ? "s" : ""}`);

    const baths = property.bathrooms ?? 0;
    if (baths > 0) includedAreas.push(`${baths} Bathroom${baths > 1 ? "s" : ""}`);

    const kitchens = (property as any).kitchens ?? 1;
    if (kitchens > 0) includedAreas.push(`${kitchens} Kitchen${kitchens > 1 ? "s" : ""}`);

    const livingRooms = (property as any).living_rooms ?? 1;
    if (livingRooms > 0) includedAreas.push(`${livingRooms} Living Room${livingRooms > 1 ? "s" : ""}`);

    const hallways = (property as any).hallways_stairs ?? 0;
    if (hallways > 0) includedAreas.push(`${hallways} Hallway${hallways > 1 ? "s" : ""}/Stairs`);

    const gardens = (property as any).gardens ?? 0;
    if (gardens > 0) includedAreas.push(`${gardens} Garden${gardens > 1 ? "s" : ""}`);

    const utility = (property as any).utility_rooms ?? 0;
    if (utility > 0) includedAreas.push(`${utility} Utility Room${utility > 1 ? "s" : ""}`);

    const storage = (property as any).storage_rooms ?? 0;
    if (storage > 0) includedAreas.push(`${storage} Storage Room${storage > 1 ? "s" : ""}`);

    const communal = (property as any).communal_areas ?? 0;
    if (communal > 0) includedAreas.push(`${communal} Communal Area${communal > 1 ? "s" : ""}`);
  }

  const propertyType = property?.property_type
    ? PROPERTY_TYPE_LABELS[property.property_type as PropertyType]
    : "Unknown";

  const furnishedStatus = (property as any)?.furnished_status
    ? FURNISHED_STATUS_LABELS[(property as any).furnished_status as FurnishedStatus]
    : null;

  return (
    <div className="space-y-4">
      {/* Job Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4" />
            Job Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Service Type</p>
              {isBundle ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1.5">
                    {bundledServices.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {INSPECTION_TYPE_LABELS[type as keyof typeof INSPECTION_TYPE_LABELS] || type.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Bundle — all services included in this visit</p>
                </div>
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {INSPECTION_TYPE_LABELS[job.inspection_type as keyof typeof INSPECTION_TYPE_LABELS]}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Tier</p>
              <TierBadge tier={tier} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Property Size</p>
              <p className="text-sm font-medium text-foreground">{propertyType}</p>
            </div>
            {furnishedStatus && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Furnishing</p>
                <p className="text-sm font-medium text-foreground">{furnishedStatus}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Turnaround</p>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">{TURNAROUND_LABELS[tier]}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Inspection Date</p>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(job.scheduled_date), "d MMM yyyy")}
              </p>
            </div>
          </div>

          {/* Clerk Payout Breakdown */}
          {clerkPayout != null && (
            <PayoutBreakdown breakdown={(job as any).clerk_payout_breakdown} fallbackTotal={clerkPayout} />
          )}
        </CardContent>
      </Card>

      {/* Tenant Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4" />
            Tenant Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenantDetails.length > 0 ? (
            <div className="space-y-3">
              {tenantDetails.map((t) => (
                <div key={t.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {t.full_name || "—"}
                      {t.tenant_order === 2 && (
                        <span className="text-xs text-muted-foreground ml-1">(Second Tenant)</span>
                      )}
                    </p>
                    {t.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {t.email}
                      </p>
                    )}
                    {t.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {t.phone}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No tenant details provided.</p>
          )}
        </CardContent>
      </Card>

      {/* Included Areas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4" />
            Included Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {includedAreas.length > 0 ? (
            <ul className="space-y-1.5">
              {includedAreas.map((area) => (
                <li key={area} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {area}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Standard areas only.</p>
          )}
        </CardContent>
      </Card>

      {/* Tier Scope Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TierIcon className="w-4 h-4" />
            {tierConfig.label} Tier — Scope Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                {bullet}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t">
            Outdoor: {tierConfig.outdoorCoverage}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClerkJobDetailPanel;