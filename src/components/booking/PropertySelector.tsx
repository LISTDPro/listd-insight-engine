import { useState } from "react";
import { Property, PROPERTY_TYPE_LABELS, FURNISHED_STATUS_LABELS } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PropertyForm, { PropertyFormData } from "./PropertyForm";
import { Building2, Plus, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertySelectorProps {
  properties: Property[];
  selectedPropertyId: string | null;
  onSelect: (propertyId: string) => void;
  onCreateProperty: (data: PropertyFormData) => Promise<void>;
  isCreating?: boolean;
}

const PropertySelector = ({
  properties,
  selectedPropertyId,
  onSelect,
  onCreateProperty,
  isCreating,
}: PropertySelectorProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateProperty = async (data: PropertyFormData) => {
    await onCreateProperty(data);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Select Property</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Choose the property for this inspection</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">Add New Property</DialogTitle>
            </DialogHeader>
            <PropertyForm
              onSubmit={handleCreateProperty}
              onCancel={() => setDialogOpen(false)}
              isLoading={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {properties.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No properties yet</p>
          <p className="text-xs text-muted-foreground mb-3">
            Add your first property to book an inspection.
          </p>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Add Property
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {properties.map((property) => {
            const isSelected = selectedPropertyId === property.id;
            return (
              <div
                key={property.id}
                onClick={() => onSelect(property.id)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  isSelected
                    ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                    : "border-border hover:border-accent/30 bg-card"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isSelected ? "bg-accent/10" : "bg-muted"
                    )}>
                      <Building2 className={cn("w-4 h-4", isSelected ? "text-accent" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{property.address_line_1}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {property.city}, {property.postcode}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {PROPERTY_TYPE_LABELS[property.property_type]}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {FURNISHED_STATUS_LABELS[property.furnished_status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-accent-foreground" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PropertySelector;
