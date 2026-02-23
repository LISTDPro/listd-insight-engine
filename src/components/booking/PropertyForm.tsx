import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PropertyType,
  FurnishedStatus,
  PROPERTY_TYPE_LABELS,
  FURNISHED_STATUS_LABELS,
} from "@/types/database";
import { Building2, MapPin, Home, Loader2, Info } from "lucide-react";
import PropertyPricingPreview from "./PropertyPricingPreview";

type RoomPreset = Pick<PropertyFormData, "bedrooms" | "bathrooms" | "kitchens" | "living_rooms" | "dining_areas" | "utility_rooms" | "storage_rooms" | "hallways_stairs" | "gardens" | "communal_areas">;

const PROPERTY_TYPE_PRESETS: Record<PropertyType, RoomPreset> = {
  studio:  { bedrooms: 0, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
  "1_bed": { bedrooms: 1, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
  "2_bed": { bedrooms: 2, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
  "3_bed": { bedrooms: 3, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
  "4_bed": { bedrooms: 4, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
  "5_bed": { bedrooms: 5, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
  "6_bed": { bedrooms: 6, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
  "7_bed": { bedrooms: 7, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
  "8_bed": { bedrooms: 8, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
  "9_bed": { bedrooms: 9, bathrooms: 1, kitchens: 1, living_rooms: 1, dining_areas: 0, utility_rooms: 0, storage_rooms: 0, hallways_stairs: 0, gardens: 0, communal_areas: 0 },
};

const ROOM_TOOLTIPS = {
  bedrooms: "Any room designed for sleeping, including master bedrooms, guest rooms, and box rooms used as bedrooms.",
  bathrooms: "Full bathrooms with bath/shower, en-suites, and separate WCs/toilets. Count each as one.",
  kitchens: "Main cooking areas. Kitchenettes in studios count as a kitchen.",
  living_rooms: "Lounges, sitting rooms, reception rooms, and TV rooms.",
  dining_areas: "Dedicated dining rooms or dining spaces separate from kitchen/living areas.",
  hallways_stairs: "Entrance halls, corridors, landings between floors, and staircases.",
  utility_rooms: "Separate rooms with washing machine, dryer, boiler, or additional storage.",
  storage_rooms: "Walk-in cupboards, loft spaces, under-stairs storage rooms.",
  gardens: "Private gardens, patios, terraces, balconies, roof terraces.",
  communal_areas: "Shared hallways, gardens, bin stores, or bike storage in flats.",
};

interface PropertyFormProps {
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: PropertyFormData;
  submitLabel?: string;
}

export interface PropertyFormData {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postcode: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  living_rooms: number;
  dining_areas: number;
  utility_rooms: number;
  storage_rooms: number;
  hallways_stairs: number;
  gardens: number;
  communal_areas: number;
  furnished_status: FurnishedStatus;
  heavily_furnished: boolean;
  notes?: string;
}

const LabelWithTooltip = ({ htmlFor, children, tooltip }: { htmlFor: string; children: React.ReactNode; tooltip: string }) => (
  <div className="flex items-center gap-1">
    <Label htmlFor={htmlFor} className="text-xs">{children}</Label>
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger type="button" className="text-muted-foreground hover:text-foreground transition-colors">
          <Info className="w-3 h-3" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-[10px]">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

const PropertyForm = ({ onSubmit, onCancel, isLoading, initialData, submitLabel }: PropertyFormProps) => {
  const [formData, setFormData] = useState<PropertyFormData>(initialData ?? {
    address_line_1: "",
    address_line_2: "",
    city: "",
    postcode: "",
    property_type: "2_bed",
    bedrooms: 2,
    bathrooms: 1,
    kitchens: 1,
    living_rooms: 1,
    dining_areas: 0,
    utility_rooms: 0,
    storage_rooms: 0,
    hallways_stairs: 0,
    gardens: 0,
    communal_areas: 0,
    furnished_status: "unfurnished",
    heavily_furnished: false,
    notes: "",
  });

  const handleChange = (field: keyof PropertyFormData, value: string | number | boolean) => {
    if (field === "property_type") {
      const preset = PROPERTY_TYPE_PRESETS[value as PropertyType];
      if (preset) {
        setFormData((prev) => ({ ...prev, property_type: value as PropertyType, ...preset }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Address */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-foreground">
          <MapPin className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Address</h3>
        </div>
        <div className="space-y-2">
          <div>
            <Label htmlFor="address_line_1" className="text-xs">Address Line 1 *</Label>
            <Input id="address_line_1" value={formData.address_line_1} onChange={(e) => handleChange("address_line_1", e.target.value)} placeholder="123 High Street" required className="text-xs h-9" />
          </div>
          <div>
            <Label htmlFor="address_line_2" className="text-xs">Address Line 2</Label>
            <Input id="address_line_2" value={formData.address_line_2} onChange={(e) => handleChange("address_line_2", e.target.value)} placeholder="Flat 2, Building Name" className="text-xs h-9" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="city" className="text-xs">City *</Label>
              <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="London" required className="text-xs h-9" />
            </div>
            <div>
              <Label htmlFor="postcode" className="text-xs">Postcode *</Label>
              <Input id="postcode" value={formData.postcode} onChange={(e) => handleChange("postcode", e.target.value.toUpperCase())} placeholder="SW1A 1AA" required className="text-xs h-9" />
            </div>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-foreground">
          <Building2 className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Property Details</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="property_type" className="text-xs">Type *</Label>
            <Select value={formData.property_type} onValueChange={(value) => handleChange("property_type", value)}>
              <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="furnished_status" className="text-xs">Furnished *</Label>
            <Select value={formData.furnished_status} onValueChange={(value) => handleChange("furnished_status", value)}>
              <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FURNISHED_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.furnished_status === "furnished" && (
          <p className="text-[10px] text-muted-foreground p-2 rounded-lg bg-muted/50 border border-border">
            Furnished properties include a £10 surcharge on Inventory and Check-Out services.
          </p>
        )}
      </div>

      {/* Room Counts */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-foreground">
          <Home className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Rooms</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">Optional — helps the clerk prepare for the inspection.</p>

        <div className="grid grid-cols-3 gap-2">
          {([
            ["bedrooms", "Bedrooms"],
            ["bathrooms", "Bathrooms"],
            ["kitchens", "Kitchens"],
            ["living_rooms", "Living Rooms"],
            ["dining_areas", "Dining Areas"],
            ["hallways_stairs", "Hallways"],
            ["utility_rooms", "Utility"],
            ["storage_rooms", "Storage"],
            ["gardens", "Gardens"],
            ["communal_areas", "Communal"],
          ] as [keyof typeof ROOM_TOOLTIPS, string][]).map(([field, label]) => (
            <div key={field}>
              <LabelWithTooltip htmlFor={field} tooltip={ROOM_TOOLTIPS[field]}>{label}</LabelWithTooltip>
              <Input
                id={field}
                type="number"
                min={0}
                max={20}
                value={formData[field] as number}
                onChange={(e) => handleChange(field, parseInt(e.target.value) || 0)}
                className="text-xs h-9"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Preview */}
      <PropertyPricingPreview formData={formData} />

      {/* Notes */}
      <div>
        <Label htmlFor="notes" className="text-xs">Notes</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Access instructions, parking details..." rows={2} className="text-xs" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-3 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading} className="text-xs">Cancel</Button>
        <Button type="submit" size="sm" disabled={isLoading} className="text-xs">
          {isLoading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>) : (submitLabel || "Save Property")}
        </Button>
      </div>
    </form>
  );
};

export default PropertyForm;
