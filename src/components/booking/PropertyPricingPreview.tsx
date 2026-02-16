import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateEstimateFromForm, serviceRequiresTier } from "@/utils/pricing";
import { INSPECTION_TYPE_LABELS, InspectionType } from "@/types/database";
import type { PropertyFormData } from "./PropertyForm";

interface PropertyPricingPreviewProps {
  formData: PropertyFormData;
}

const PropertyPricingPreview = ({ formData }: PropertyPricingPreviewProps) => {
  const estimate = useMemo(() => {
    return calculateEstimateFromForm(
      formData.property_type,
      formData.furnished_status,
      {
        kitchens: formData.kitchens,
        bathrooms: formData.bathrooms,
        living_rooms: formData.living_rooms,
        dining_areas: formData.dining_areas,
        hallways_stairs: formData.hallways_stairs,
        utility_rooms: formData.utility_rooms,
        storage_rooms: formData.storage_rooms,
        gardens: formData.gardens,
        communal_areas: formData.communal_areas,
      },
      formData.heavily_furnished
    );
  }, [formData]);

  const inspectionTypes: InspectionType[] = [
    "new_inventory",
    "check_in",
    "check_out",
    "interim",
  ];

  

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-foreground">
        <PoundSterling className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold uppercase tracking-wider">
          Pricing Estimate
        </h3>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger type="button" className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-3 h-3" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-[10px]">
              <p>
                Live estimate based on property details. Tiered services show Flex
                base price. Check-In and Interim are flat-rate.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Prices update as you change property details.
      </p>

      {/* Per-service prices — show Flex base for tiered, flat for others */}
      <div className="grid grid-cols-2 gap-1.5">
        {inspectionTypes.map((type) => {
          const hasTiers = serviceRequiresTier(type);
          // Show flex price as the "from" price for tiered services
          const price = estimate.perService[type]?.flex ?? estimate.perService[type]?.flex ?? 0;
          const total = price + estimate.addOnsTotal;
          return (
            <div
              key={type}
              className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 bg-muted/30"
            >
              <span className="text-[10px] text-muted-foreground truncate mr-1">
                {INSPECTION_TYPE_LABELS[type]}
              </span>
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                {hasTiers ? "from " : ""}£{total.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add-ons breakdown */}
      {estimate.addOns.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Add-ons included
            </p>
            {estimate.addOns.map((addon, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="text-muted-foreground">
                  {addon.quantity > 1 ? `${addon.quantity}× ` : ""}
                  {addon.label}
                </span>
                <span className="text-foreground font-medium">
                  +£{addon.total.toFixed(0)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border">
              <span className="text-muted-foreground font-medium">
                Total add-ons
              </span>
              <span className="text-foreground font-semibold">
                +£{estimate.addOnsTotal.toFixed(0)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Payment note */}
      <Separator />
      <p className="text-[9px] text-muted-foreground leading-tight">
        Payment is processed upon report approval in line with LISTD terms.
      </p>
    </div>
  );
};

export default PropertyPricingPreview;
