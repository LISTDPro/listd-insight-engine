import { InspectionType, INSPECTION_TYPE_LABELS } from "@/types/database";
import { cn } from "@/lib/utils";
import { Check, ClipboardCheck, LogIn, LogOut, Clock, FileSearch } from "lucide-react";

interface InspectionTypeSelectorProps {
  selectedTypes: InspectionType[];
  onSelect: (types: InspectionType[]) => void;
}

const INSPECTION_TYPE_CONFIG: Record<
  InspectionType,
  { icon: typeof ClipboardCheck; description: string }
> = {
  new_inventory: {
    icon: ClipboardCheck,
    description: "Full property inventory before first tenancy",
  },
  check_in: {
    icon: LogIn,
    description: "Record property condition at tenant move-in",
  },
  check_out: {
    icon: LogOut,
    description: "Compare property condition at tenant move-out",
  },
  mid_term: {
    icon: Clock,
    description: "Periodic inspection during tenancy (6-month)",
  },
  interim: {
    icon: FileSearch,
    description: "Quick property check between inspections",
  },
};

const InspectionTypeSelector = ({
  selectedTypes,
  onSelect,
}: InspectionTypeSelectorProps) => {
  const handleToggle = (type: InspectionType) => {
    if (selectedTypes.includes(type)) {
      onSelect(selectedTypes.filter((t) => t !== type));
    } else {
      onSelect([...selectedTypes, type]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Select Inspection Type(s)</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Combine services like Inventory + Check-In for full coverage.
        </p>
      </div>
      <div className="space-y-2">
        {(Object.keys(INSPECTION_TYPE_CONFIG) as InspectionType[]).map((type) => {
          const config = INSPECTION_TYPE_CONFIG[type];
          const Icon = config.icon;
          const isSelected = selectedTypes.includes(type);

          return (
            <div
              key={type}
              onClick={() => handleToggle(type)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30 bg-card"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary/10" : "bg-muted"
                )}>
                  <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    {INSPECTION_TYPE_LABELS[type]}
                  </h4>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                  isSelected
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedTypes.length > 1 && (
        <div className="p-2.5 rounded-lg bg-success/10 border border-success/30">
          <p className="text-xs text-success font-medium">
            📦 Bundle: {selectedTypes.map(t => INSPECTION_TYPE_LABELS[t]).join(' + ')}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Combined services are priced individually and performed in a single visit.
          </p>
        </div>
      )}
    </div>
  );
};

export default InspectionTypeSelector;
