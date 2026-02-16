import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Home, Sofa, PoundSterling } from "lucide-react";
import {
  PropertyType,
  FurnishedStatus,
  PROPERTY_TYPE_LABELS,
  FURNISHED_STATUS_LABELS,
  InspectionType,
} from "@/types/database";
import { getServicePrice, serviceRequiresTier, FURNISHED_SURCHARGE, FURNISHING_SERVICES } from "@/utils/pricing";
import type { ServiceTier } from "@/components/booking/TierSelector";
import { Separator } from "@/components/ui/separator";

interface PropertySizeSelectorProps {
  selectedSize: PropertyType;
  selectedFurnishing: FurnishedStatus;
  onSizeChange: (size: PropertyType) => void;
  onFurnishingChange: (status: FurnishedStatus) => void;
  inspectionTypes: InspectionType[];
  selectedTier: ServiceTier;
}

const SIZES: PropertyType[] = [
  "studio", "1_bed", "2_bed", "3_bed", "4_bed",
  "5_bed", "6_bed", "7_bed", "8_bed", "9_bed",
];

const FURNISHING_OPTIONS: FurnishedStatus[] = ["unfurnished", "furnished", "part_furnished"];

const PropertySizeSelector = ({
  selectedSize,
  selectedFurnishing,
  onSizeChange,
  onFurnishingChange,
  inspectionTypes,
  selectedTier,
}: PropertySizeSelectorProps) => {
  const isFurnished = selectedFurnishing === "furnished";
  const hasFurnishingSurcharge = inspectionTypes.some((t) => FURNISHING_SERVICES.includes(t));

  const totalPrice = useMemo(() => {
    return inspectionTypes.reduce(
      (sum, type) => sum + getServicePrice(type, selectedSize, selectedTier, isFurnished),
      0,
    );
  }, [inspectionTypes, selectedSize, selectedTier, isFurnished]);

  return (
    <div className="space-y-5">
      {/* Property Size */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-foreground">
          <Home className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Property Size</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {SIZES.map((size) => {
            const isSelected = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => onSizeChange(size)}
                className={cn(
                  "relative px-2.5 py-2 rounded-lg border text-center transition-all text-xs font-medium",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20 text-foreground"
                    : "border-border hover:border-primary/30 bg-card text-muted-foreground"
                )}
              >
                {PROPERTY_TYPE_LABELS[size].replace(" Bedroom", " Bed").replace(" Bedrooms", " Bed")}
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Furnishing */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-foreground">
          <Sofa className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Furnishing</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {FURNISHING_OPTIONS.map((status) => {
            const isSelected = selectedFurnishing === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onFurnishingChange(status)}
                className={cn(
                  "relative px-3 py-2.5 rounded-lg border text-center transition-all text-xs font-medium",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20 text-foreground"
                    : "border-border hover:border-primary/30 bg-card text-muted-foreground"
                )}
              >
                {FURNISHED_STATUS_LABELS[status]}
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {isFurnished && hasFurnishingSurcharge && (
          <p className="text-[10px] text-muted-foreground p-2 rounded-lg bg-muted/50 border border-border">
            Furnished properties include a £{FURNISHED_SURCHARGE} surcharge on Inventory and Check-Out services.
          </p>
        )}
      </div>

      {/* Live Price */}
      <Separator />
      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
        <div className="flex items-center gap-1.5">
          <PoundSterling className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Your Price</span>
        </div>
        <span className="text-xl font-bold text-accent">£{totalPrice}</span>
      </div>
      <p className="text-[9px] text-muted-foreground leading-tight">
        Payment is processed upon report approval in line with LISTD terms.
      </p>
    </div>
  );
};

export default PropertySizeSelector;
