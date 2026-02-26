import { format, isToday, isTomorrow, differenceInHours } from "date-fns";
import { MapPin, Calendar, Clock, Home, Bed, Bath, PoundSterling, AlertTriangle, Sofa } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TierBadge from "@/components/ui/tier-badge";
import { Card, CardContent } from "@/components/ui/card";
import { INSPECTION_TYPE_LABELS, PROPERTY_TYPE_LABELS, FURNISHED_STATUS_LABELS, FurnishedStatus } from "@/types/database";
import { calculatePayoutBreakdown } from "@/utils/escrow";

interface SwipeJobCardContentProps {
  job: {
    id: string;
    inspection_type: string;
    scheduled_date: string;
    preferred_time_slot?: string | null;
    special_instructions?: string | null;
    status: string;
    quoted_price?: number | null;
    final_price?: number | null;
    service_tier?: string | null;
    provider_id?: string | null;
    property?: {
      address_line_1: string;
      address_line_2?: string | null;
      city: string;
      postcode: string;
      bedrooms: number;
      bathrooms: number;
      property_type: string;
      furnished_status?: string;
      notes?: string | null;
    } | null;
  };
  statusBadge?: React.ReactNode;
  /** Show net payout instead of gross (for clerks) */
  showNetPayout?: boolean;
}

const SwipeJobCardContent = ({ job, statusBadge, showNetPayout = false }: SwipeJobCardContentProps) => {
  const property = job.property;
  const inspectionLabel =
    INSPECTION_TYPE_LABELS[job.inspection_type as keyof typeof INSPECTION_TYPE_LABELS] ||
    job.inspection_type;
  const propertyTypeLabel = property
    ? PROPERTY_TYPE_LABELS[property.property_type as keyof typeof PROPERTY_TYPE_LABELS] ||
      property.property_type
    : "";

  // Urgency badge
  const getUrgencyBadge = () => {
    const scheduledDate = new Date(job.scheduled_date);
    if (isToday(scheduledDate)) {
      return <Badge className="bg-destructive text-destructive-foreground text-[10px]">Today</Badge>;
    }
    if (isTomorrow(scheduledDate)) {
      return <Badge className="bg-warning text-warning-foreground text-[10px]">Tomorrow</Badge>;
    }
    const hoursAway = differenceInHours(scheduledDate, new Date());
    if (hoursAway <= 72) {
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[10px]">Urgent</Badge>;
    }
    return null;
  };

  // Net payout for clerks — use stored clerk payout if available
  const grossPrice = job.final_price || job.quoted_price || 0;
  const clerkPayoutStored = (job as any).clerk_final_payout || (job as any).clerk_payout;
  const payout = clerkPayoutStored
    ? { clerkPayout: clerkPayoutStored, platformFee: grossPrice - clerkPayoutStored, providerFee: 0, grossAmount: grossPrice }
    : calculatePayoutBreakdown(grossPrice);
  const urgencyBadge = getUrgencyBadge();

  return (
    <Card className="h-full overflow-hidden shadow-lg border-2">
      <CardContent className="p-5 space-y-4">
        {/* Header badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge}
          <Badge variant="outline" className="text-xs">
            {inspectionLabel}
          </Badge>
          <TierBadge tier={job.service_tier} size="sm" />
          {urgencyBadge}
        </div>

        {/* Created by */}
        {(job as any).created_by_name && (
          <p className="text-xs text-muted-foreground">
            Created by: <span className="font-medium text-foreground">{(job as any).created_by_name}</span>
          </p>
        )}

        {/* Address */}
        {property && (
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">
              {property.address_line_1}
            </h3>
            {property.address_line_2 && (
              <p className="text-sm text-muted-foreground">{property.address_line_2}</p>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {property.city}, {property.postcode}
            </div>
          </div>
        )}

        {/* Property details */}
        {property && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              {propertyTypeLabel}
            </span>
            {property.furnished_status && (
              <span className="flex items-center gap-1">
                <Sofa className="w-3.5 h-3.5" />
                {FURNISHED_STATUS_LABELS[property.furnished_status as FurnishedStatus] || property.furnished_status}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" />
              {property.bedrooms} bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {property.bathrooms} bath
            </span>
          </div>
        )}

        {/* Schedule */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            {format(new Date(job.scheduled_date), "EEE, d MMM yyyy")}
          </span>
          {job.preferred_time_slot && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {job.preferred_time_slot === "morning" && "9:00 - 12:00"}
              {job.preferred_time_slot === "afternoon" && "12:00 - 17:00"}
              {job.preferred_time_slot === "evening" && "17:00 - 20:00"}
            </span>
          )}
        </div>

        {/* Price — show net payout for clerks */}
        {grossPrice > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            {showNetPayout ? (
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Your Payout</span>
                <div className="flex items-center gap-1 text-accent">
                  <PoundSterling className="w-5 h-5" />
                  <span className="text-2xl font-bold">{payout.clerkPayout.toFixed(0)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-primary">
                <PoundSterling className="w-5 h-5" />
                <span className="text-2xl font-bold">{grossPrice.toFixed(0)}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  {job.final_price ? "final" : "quoted"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Special instructions */}
        {job.special_instructions && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 line-clamp-2">
            {job.special_instructions}
          </p>
        )}

        {/* Swipe hint */}
        <div className="text-center text-xs text-muted-foreground/60 pt-2">
          ← Swipe or tap buttons below →
        </div>
      </CardContent>
    </Card>
  );
};

export default SwipeJobCardContent;
