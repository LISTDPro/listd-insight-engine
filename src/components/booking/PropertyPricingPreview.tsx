import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getServicePrice, serviceRequiresTier } from "@/utils/pricing";
import { INSPECTION_TYPE_LABELS, InspectionType } from "@/types/database";
import type { PropertyFormData } from "./PropertyForm";

interface PropertyPricingPreviewProps {
  formData: PropertyFormData;
}

const PropertyPricingPreview = ({ formData }: PropertyPricingPreviewProps) => {
  const inspectionTypes: InspectionType[] = [
    "new_inventory",
    "check_in",
    "check_out",
    "interim",
  ];

  const prices = useMemo(() => {
    return inspectionTypes.map((type) => ({
      type,
      hasTiers: serviceRequiresTier(type),
      price: getServicePrice(type, formData.property_type, "flex", formData.furnished_status),
    }));
  }, [formData.property_type, formData.furnished_status]);

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
                Price based on service type, property size, and tier.
                Check-In and Interim are flat-rate.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Prices update as you change property size and furnishing.
      </p>

      {/* Per-service prices */}
      <div className="grid grid-cols-2 gap-1.5">
        {prices.map(({ type, hasTiers, price }) => (
          <div
            key={type}
            className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 bg-muted/30"
          >
            <span className="text-[10px] text-muted-foreground truncate mr-1">
              {INSPECTION_TYPE_LABELS[type]}
            </span>
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              £{price}
            </span>
          </div>
        ))}
      </div>

      {/* Payment note */}
      <Separator />
      <p className="text-[9px] text-muted-foreground leading-tight">
        Payment is processed upon report approval in line with LISTD terms.
      </p>
    </div>
  );
};

export default PropertyPricingPreview;
