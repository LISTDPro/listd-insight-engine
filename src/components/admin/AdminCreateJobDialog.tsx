import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  InspectionType,
  PropertyType,
  FurnishedStatus,
  INSPECTION_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  FURNISHED_STATUS_LABELS,
} from "@/types/database";
import { calculateJobPrice, getServicePrice, serviceRequiresTier } from "@/utils/pricing";
import { getFullClerkPayout, calculateBundleClerkPayout, calculateMargin } from "@/utils/clerkPricing";
import { isShortNotice, SHORT_NOTICE_SURCHARGE } from "@/components/booking/BookingSummary";
import { ServiceTier } from "@/components/booking/TierSelector";
import { format, startOfToday, isBefore } from "date-fns";
import { CalendarIcon, Loader2, PoundSterling, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminCreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: () => void;
  clients: Array<{ user_id: string; full_name: string | null; email: string | null }>;
}

const TIERS: ServiceTier[] = ["flex", "core", "priority"];
const TIER_LABELS: Record<ServiceTier, string> = { flex: "Flex", core: "Core", priority: "Priority" };

const TIME_SLOTS = [
  { value: "morning", label: "Morning (9–12)" },
  { value: "afternoon", label: "Afternoon (12–17)" },
  { value: "evening", label: "Evening (17–20)" },
];

const AdminCreateJobDialog = ({
  open,
  onOpenChange,
  onJobCreated,
  clients,
}: AdminCreateJobDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [inspectionTypes, setInspectionTypes] = useState<InspectionType[]>([]);
  const [tier, setTier] = useState<ServiceTier>("core");
  const [propertySize, setPropertySize] = useState<PropertyType>("2_bed");
  const [furnishing, setFurnishing] = useState<FurnishedStatus>("unfurnished");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  // Properties for selected client
  const [clientProperties, setClientProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Fetch properties when client changes
  useEffect(() => {
    if (!selectedClientId) {
      setClientProperties([]);
      setSelectedPropertyId("");
      return;
    }
    setLoadingProperties(true);
    supabase
      .from("properties")
      .select("*")
      .eq("client_id", selectedClientId)
      .then(({ data }) => {
        setClientProperties(data || []);
        setLoadingProperties(false);
      });
  }, [selectedClientId]);

  const needsTier = useMemo(
    () => inspectionTypes.some((t) => serviceRequiresTier(t)),
    [inspectionTypes],
  );

  const selectedProperty = clientProperties.find((p) => p.id === selectedPropertyId) || null;

  // Pricing calculations using existing logic
  const shortNotice = isShortNotice(selectedDate);

  const pricingProperty = {
    property_type: propertySize,
    furnished_status: furnishing,
  } as any;

  const basePrice = inspectionTypes.length > 0
    ? calculateJobPrice(pricingProperty, inspectionTypes, tier)
    : 0;

  const clientTotal = basePrice + (shortNotice ? SHORT_NOTICE_SURCHARGE : 0);

  // Clerk payout using existing logic
  let clerkPay = 0;
  try {
    if (inspectionTypes.length > 1) {
      const bundle = calculateBundleClerkPayout(inspectionTypes, propertySize, selectedProperty, tier);
      clerkPay = bundle.grandTotal;
    } else if (inspectionTypes.length === 1) {
      const result = getFullClerkPayout(inspectionTypes[0], propertySize, selectedProperty, tier);
      clerkPay = result.total;
    }
  } catch {}

  const margin = calculateMargin(clientTotal, clerkPay);

  const filteredClients = clients.filter((c) => {
    if (!clientSearch) return true;
    const search = clientSearch.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search)
    );
  });

  const toggleInspectionType = (type: InspectionType) => {
    setInspectionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const canSubmit =
    selectedClientId &&
    inspectionTypes.length > 0 &&
    selectedDate &&
    selectedPropertyId;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);

    const primaryType = inspectionTypes[0];
    const additionalTypes = inspectionTypes.slice(1);

    let instructions = specialInstructions;
    if (additionalTypes.length > 0) {
      instructions = `[Additional services: ${additionalTypes.join(", ")}]\n\n${instructions}`;
    }
    if (needsTier) {
      instructions = `[Service tier: ${tier}]\n\n${instructions}`;
    }

    // Build clerk payout breakdown
    let payoutBreakdown: Record<string, unknown> = {};
    try {
      if (inspectionTypes.length > 1) {
        const bundle = calculateBundleClerkPayout(inspectionTypes, propertySize, selectedProperty, tier);
        payoutBreakdown = { bundle: true, services: bundle.services, grandTotal: bundle.grandTotal, tier: bundle.tier, size: bundle.size };
      } else {
        const result = getFullClerkPayout(primaryType, propertySize, selectedProperty, tier);
        payoutBreakdown = { bundle: false, base: result.base, addOns: result.addOns, addOnsTotal: result.addOnsTotal, tier: result.tier, size: result.size, inspectionType: result.inspectionType };
      }
    } catch {}

    // Get client's org ID
    let orgId: string | null = null;
    try {
      const { data } = await supabase.rpc("get_user_org_id", { _user_id: selectedClientId });
      orgId = data || null;
    } catch {}

    const { data: newJob, error } = await supabase
      .from("jobs")
      .insert({
        client_id: selectedClientId,
        created_by_user_id: user.id,
        organisation_id: orgId || undefined,
        property_id: selectedPropertyId,
        inspection_type: primaryType,
        inspection_types: inspectionTypes,
        scheduled_date: format(selectedDate!, "yyyy-MM-dd"),
        preferred_time_slot: timeSlot || null,
        special_instructions: instructions || null,
        quoted_price: clientTotal,
        service_tier: tier,
        status: "published",
        clerk_payout: clerkPay,
        clerk_final_payout: clerkPay,
        clerk_payout_breakdown: payoutBreakdown,
        clerk_payout_log: [{ timestamp: new Date().toISOString(), reason: "admin_created", payout: clerkPay }],
        margin,
        short_notice_surcharge_applied: shortNotice,
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating job", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Notify via edge functions (non-blocking)
    if (newJob) {
      const prop = selectedProperty;
      try {
        await supabase.functions.invoke("notify-job-published", {
          body: {
            jobId: newJob.id,
            propertyAddress: prop?.address_line_1 || "Property",
            city: prop?.city || "",
            postcode: prop?.postcode || "",
            inspectionType: primaryType,
            scheduledDate: format(selectedDate!, "yyyy-MM-dd"),
            timeSlot: timeSlot || undefined,
          },
        });
      } catch {}
      try {
        await supabase.functions.invoke("notify-admin", {
          body: {
            type: "job_posted",
            jobId: newJob.id,
            propertyAddress: prop?.address_line_1 || "Property",
            city: prop?.city || "",
            postcode: prop?.postcode || "",
            inspectionType: primaryType,
            scheduledDate: format(selectedDate!, "yyyy-MM-dd"),
          },
        });
      } catch {}
    }

    setSubmitting(false);
    toast({ title: "Job created", description: "Job has been published successfully." });
    onOpenChange(false);
    onJobCreated();

    // Reset
    setSelectedClientId("");
    setInspectionTypes([]);
    setSelectedDate(null);
    setSpecialInstructions("");
    setSelectedPropertyId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Job (Admin)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Client Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Client *</Label>
            <Input
              placeholder="Search clients..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="text-xs"
            />
            <div className="max-h-32 overflow-y-auto border border-border rounded-lg">
              {filteredClients.slice(0, 20).map((c) => (
                <button
                  key={c.user_id}
                  type="button"
                  onClick={() => {
                    setSelectedClientId(c.user_id);
                    setClientSearch(c.full_name || c.email || "");
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
                    selectedClientId === c.user_id && "bg-accent/10 font-medium",
                  )}
                >
                  <span className="font-medium">{c.full_name || "—"}</span>
                  {c.email && <span className="text-muted-foreground ml-2">{c.email}</span>}
                </button>
              ))}
              {filteredClients.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No clients found</p>
              )}
            </div>
          </div>

          {/* Property Selection */}
          {selectedClientId && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Property *</Label>
              {loadingProperties ? (
                <p className="text-xs text-muted-foreground">Loading properties...</p>
              ) : clientProperties.length === 0 ? (
                <p className="text-xs text-muted-foreground">No properties found for this client. The client must add a property first.</p>
              ) : (
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientProperties.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.address_line_1}, {p.city} {p.postcode} — {PROPERTY_TYPE_LABELS[p.property_type as PropertyType] || p.property_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Inspection Types */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Service Type(s) *</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(INSPECTION_TYPE_LABELS) as InspectionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleInspectionType(type)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg border transition-all",
                    inspectionTypes.includes(type)
                      ? "border-accent bg-accent/10 text-accent font-medium"
                      : "border-border hover:border-accent/30",
                  )}
                >
                  {INSPECTION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Tier */}
          {needsTier && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Service Tier</Label>
              <div className="flex gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={cn(
                      "px-4 py-2 text-xs rounded-lg border transition-all flex-1",
                      tier === t
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:border-primary/30",
                    )}
                  >
                    {TIER_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Property Size + Furnishing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Property Size</Label>
              <Select value={propertySize} onValueChange={(v) => setPropertySize(v as PropertyType)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((size) => (
                    <SelectItem key={size} value={size} className="text-xs">
                      {PROPERTY_TYPE_LABELS[size]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Furnishing</Label>
              <Select value={furnishing} onValueChange={(v) => setFurnishing(v as FurnishedStatus)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FURNISHED_STATUS_LABELS) as FurnishedStatus[]).map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">
                      {FURNISHED_STATUS_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Date *</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(d) => { setSelectedDate(d || null); setCalendarOpen(false); }}
                  disabled={(date) => isBefore(date, startOfToday())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {shortNotice && (
              <p className="text-[10px] text-destructive font-medium">
                ⚡ Short-notice surcharge (£{SHORT_NOTICE_SURCHARGE}) will apply
              </p>
            )}
          </div>

          {/* Time Slot */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Time Slot (Optional)</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Special Instructions</Label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Access codes, parking, etc."
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Price Preview */}
          {inspectionTypes.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-1.5 mb-2">
                <PoundSterling className="w-4 h-4" />
                <span className="text-xs font-semibold">Price Preview</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Client Price</p>
                  <p className="text-lg font-bold text-foreground">£{clientTotal}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Clerk Payout</p>
                  <p className="text-lg font-bold text-accent">£{clerkPay}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Margin</p>
                  <p className={cn("text-lg font-bold", margin >= 0 ? "text-success" : "text-destructive")}>
                    £{margin}
                  </p>
                </div>
              </div>
              {shortNotice && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Includes £{SHORT_NOTICE_SURCHARGE} short-notice surcharge
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Creating...
                </>
              ) : (
                "Create & Publish Job"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateJobDialog;
