import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getServicePrice, serviceRequiresTier, ADD_ON_PRICES } from "@/utils/pricing";
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

  const addOns = useMemo(() => {
    const items: { label: string; total: number }[] = [];
    // Extra bedrooms beyond property type
    const PROPERTY_SIZES = ["studio", "1_bed", "2_bed", "3_bed", "4_bed", "5_bed", "6_bed", "7_bed", "8_bed", "9_bed"];
    const baseBedrooms = PROPERTY_SIZES.indexOf(formData.property_type);
    const extraBedrooms = Math.max(0, (formData.bedrooms ?? baseBedrooms) - Math.max(baseBedrooms, 0));
    if (extraBedrooms > 0) items.push({ label: `Additional Bedroom ×${extraBedrooms}`, total: extraBedrooms * ADD_ON_PRICES.additionalBedroom });
    const extraKitchens = Math.max(0, (formData.kitchens ?? 1) - 1);
    if (extraKitchens > 0) items.push({ label: `Additional Kitchen ×${extraKitchens}`, total: extraKitchens * ADD_ON_PRICES.additionalKitchen });
    const extraBathrooms = Math.max(0, (formData.bathrooms ?? 1) - 1);
    if (extraBathrooms > 0) items.push({ label: `Additional Bathroom ×${extraBathrooms}`, total: extraBathrooms * ADD_ON_PRICES.additionalBathroom });
    const extraLiving = Math.max(0, (formData.living_rooms ?? 1) - 1);
    if (extraLiving > 0) items.push({ label: `Additional Living Room ×${extraLiving}`, total: extraLiving * ADD_ON_PRICES.additionalLivingRoom });
    const extraDining = Math.max(0, (formData.dining_areas ?? 1) - 1);
    if (extraDining > 0) items.push({ label: `Additional Dining Area ×${extraDining}`, total: extraDining * ADD_ON_PRICES.additionalDiningArea });
    const extraHallways = Math.max(0, (formData.hallways_stairs ?? 1) - 1);
    if (extraHallways > 0) items.push({ label: `Hallways / Stairs ×${extraHallways}`, total: extraHallways * ADD_ON_PRICES.hallwaysStairs });
    const extraUtility = Math.max(0, (formData.utility_rooms ?? 1) - 1);
    if (extraUtility > 0) items.push({ label: `Utility Room ×${extraUtility}`, total: extraUtility * ADD_ON_PRICES.utilityRoom });
    const extraStorage = Math.max(0, (formData.storage_rooms ?? 1) - 1);
    if (extraStorage > 0) items.push({ label: `Storage Room ×${extraStorage}`, total: extraStorage * ADD_ON_PRICES.storageRoom });
    const extraGardens = Math.max(0, (formData.gardens ?? 1) - 1);
    if (extraGardens > 0) items.push({ label: `Garden ×${extraGardens}`, total: extraGardens * ADD_ON_PRICES.garden });
    const extraCommunal = Math.max(0, (formData.communal_areas ?? 1) - 1);
    if (extraCommunal > 0) items.push({ label: `Communal Area ×${extraCommunal}`, total: extraCommunal * ADD_ON_PRICES.communalArea });
    if (formData.heavily_furnished) items.push({ label: "Heavily Furnished", total: ADD_ON_PRICES.heavilyFurnished });
    return items;
  }, [formData.property_type, formData.bedrooms, formData.kitchens, formData.bathrooms, formData.living_rooms, formData.dining_areas, formData.hallways_stairs, formData.utility_rooms, formData.storage_rooms, formData.gardens, formData.communal_areas, formData.heavily_furnished]);

  const addOnsTotal = addOns.reduce((sum, a) => sum + a.total, 0);

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

      {/* Add-on fees */}
      {addOns.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">Add-on fees (per service):</p>
          {addOns.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-[10px] px-2.5">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">+£{item.total}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-[10px] px-2.5 pt-1 border-t border-border">
            <span className="text-muted-foreground font-medium">Add-ons total</span>
            <span className="font-semibold text-foreground">+£{addOnsTotal}</span>
          </div>
        </div>
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
