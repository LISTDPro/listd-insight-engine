import { format } from "date-fns";
import { Property, InspectionType, INSPECTION_TYPE_LABELS, PROPERTY_TYPE_LABELS, FURNISHED_STATUS_LABELS, PropertyType, FurnishedStatus } from "@/types/database";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, CalendarDays, Clock, ClipboardList, MapPin, PoundSterling, AlertCircle, Layers, Home, Sofa } from "lucide-react";
import { getServicePrice, serviceRequiresTier, serviceUsesFurnishing, calculatePriceBreakdown } from "@/utils/pricing";
import { ServiceTier, TIER_LABELS, SERVICE_TIERS } from "@/components/booking/TierSelector";

interface BookingSummaryProps {
  property: Property | null;
  inspectionTypes: InspectionType[];
  selectedTier: ServiceTier;
  scheduledDate: Date | null;
  timeSlot: string | null;
  specialInstructions: string;
  onInstructionsChange: (value: string) => void;
  detailsConfirmed: boolean;
  onDetailsConfirmedChange: (value: boolean) => void;
  selectedSize: PropertyType;
  selectedFurnishing: FurnishedStatus;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "Morning (9:00 – 12:00)",
  afternoon: "Afternoon (12:00 – 17:00)",
  evening: "Evening (17:00 – 20:00)",
};

const BookingSummary = ({
  property,
  inspectionTypes,
  selectedTier,
  scheduledDate,
  timeSlot,
  specialInstructions,
  onInstructionsChange,
  detailsConfirmed,
  onDetailsConfirmedChange,
  selectedSize,
  selectedFurnishing,
}: BookingSummaryProps) => {
  const showTier = inspectionTypes.some((t) => serviceRequiresTier(t));

  // Calculate price from size/furnishing selections (not from property)
  const services = inspectionTypes.map((type) => ({
    type,
    price: getServicePrice(type, selectedSize, selectedTier, selectedFurnishing),
  }));
  const servicesTotal = services.reduce((sum, s) => sum + s.price, 0);

  // Calculate add-ons from property room counts
  const breakdown = calculatePriceBreakdown(property, inspectionTypes, selectedTier);
  const addOns = breakdown.addOns;
  const addOnsTotal = breakdown.addOnsTotal;
  const grandTotal = servicesTotal + addOnsTotal;

  const tierConfig = SERVICE_TIERS.find((t) => t.value === selectedTier);
  const TierIcon = tierConfig?.icon;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Review & Submit</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Confirm your booking details before submitting.</p>
      </div>

      {/* Summary Card */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          Booking Summary
        </h4>

        <div className="space-y-2.5">
          {/* Size & Furnishing */}
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
              <Home className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">{PROPERTY_TYPE_LABELS[selectedSize]}</div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Sofa className="w-2.5 h-2.5" />
                {FURNISHED_STATUS_LABELS[selectedFurnishing]}
              </div>
            </div>
          </div>

          {/* Property Address */}
          {property && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">{property.address_line_1}</div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="w-2.5 h-2.5" />
                  {property.city}, {property.postcode}
                </div>
              </div>
            </div>
          )}

          {/* Inspection Types */}
          {inspectionTypes.length > 0 && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">
                  {inspectionTypes.length > 1 ? "Services Bundle" : "Inspection Type"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {inspectionTypes.map((t) => INSPECTION_TYPE_LABELS[t]).join(" + ")}
                </div>
              </div>
            </div>
          )}

          {/* Service Tier — only show when applicable */}
          {showTier && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">Service Tier</div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {TierIcon && <TierIcon className="w-2.5 h-2.5 text-accent" />}
                  {TIER_LABELS[selectedTier]} — {tierConfig?.tagline}
                </div>
              </div>
            </div>
          )}

          {/* Date & Time */}
          {scheduledDate && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">
                  {format(scheduledDate, "EEEE, d MMMM yyyy")}
                </div>
                {timeSlot && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {TIME_SLOT_LABELS[timeSlot]}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        {servicesTotal > 0 && (
          <div className="pt-3 border-t border-border space-y-1.5">
            <div className="flex items-center gap-1.5 mb-2">
              <PoundSterling className="w-3.5 h-3.5 text-foreground" />
              <span className="text-xs font-semibold text-foreground">Price Breakdown</span>
            </div>

            {services.map((service, index) => (
              <div key={index} className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{INSPECTION_TYPE_LABELS[service.type]}</span>
                <span className="font-medium text-foreground">£{service.price}</span>
              </div>
            ))}

            {services.length > 1 && (
              <div className="flex justify-between text-[11px] pt-1 border-t border-border/50">
                <span className="text-muted-foreground font-medium">Services Subtotal</span>
                <span className="font-medium text-foreground">£{servicesTotal}</span>
              </div>
            )}

            {/* Add-Ons */}
            {addOns.length > 0 && (
              <div className="pt-1.5 border-t border-border/50 space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Add-Ons</span>
                {addOns.map((addOn, index) => (
                  <div key={index} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      {addOn.label}{addOn.quantity > 1 ? ` ×${addOn.quantity}` : ""}
                    </span>
                    <span className="font-medium text-foreground">£{addOn.total}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[11px] pt-1 border-t border-border/50">
                  <span className="text-muted-foreground font-medium">Add-Ons Subtotal</span>
                  <span className="font-medium text-foreground">£{addOnsTotal}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-border mt-1">
              <span className="text-xs font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-accent">£{grandTotal}</span>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Payment is processed upon report approval in line with LISTD terms.
            </p>
          </div>
        )}
      </div>

      {/* Special Instructions */}
      <div className="space-y-1.5">
        <Label htmlFor="special_instructions" className="text-xs">
          Special Instructions (Optional)
        </Label>
        <Textarea
          id="special_instructions"
          value={specialInstructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder="Access codes, parking, or special requirements..."
          rows={2}
          className="text-xs"
        />
      </div>

      {/* Acknowledgment */}
      <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="details_confirmed"
            checked={detailsConfirmed}
            onCheckedChange={(checked) => onDetailsConfirmedChange(checked === true)}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label
              htmlFor="details_confirmed"
              className="cursor-pointer text-xs font-medium text-foreground flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 text-warning" />I confirm the property details are accurate
            </Label>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Incorrect details may result in price adjustments after the inspection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
