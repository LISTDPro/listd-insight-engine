import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { useJobs } from "@/hooks/useJobs";
import { InspectionType, PropertyType, FurnishedStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PropertySelector from "@/components/booking/PropertySelector";
import InspectionTypeSelector from "@/components/booking/InspectionTypeSelector";
import TierSelector, { ServiceTier } from "@/components/booking/TierSelector";
import TierSummaryPanel from "@/components/booking/TierSummaryPanel";
import PropertySizeSelector from "@/components/booking/PropertySizeSelector";
import DateTimeSelector from "@/components/booking/DateTimeSelector";
import BookingSummary, { isShortNotice, SHORT_NOTICE_SURCHARGE } from "@/components/booking/BookingSummary";
import TenantDetailsForm, { TenantData } from "@/components/booking/TenantDetailsForm";
import { PropertyFormData } from "@/components/booking/PropertyForm";
import { calculateJobPrice, serviceRequiresTier } from "@/utils/pricing";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

type BookingStep = "inspection" | "tier" | "size" | "property" | "date" | "tenant" | "review";

const ALL_STEPS: { key: BookingStep; label: string }[] = [
  { key: "inspection", label: "Service" },
  { key: "tier", label: "Tier" },
  { key: "size", label: "Size" },
  { key: "property", label: "Property" },
  { key: "date", label: "Schedule" },
  { key: "tenant", label: "Tenant" },
  { key: "review", label: "Review" },
];

const BookJob = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const { properties, createProperty, loading: propertiesLoading } = useProperties();
  const { createJob } = useJobs();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<BookingStep>("inspection");
  const [selectedInspectionTypes, setSelectedInspectionTypes] = useState<InspectionType[]>([]);
  const [selectedTier, setSelectedTier] = useState<ServiceTier>("core");
  const [selectedSize, setSelectedSize] = useState<PropertyType>("2_bed");
  const [selectedFurnishing, setSelectedFurnishing] = useState<FurnishedStatus>("unfurnished");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
  const [tierAcknowledged, setTierAcknowledged] = useState(false);
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryTenant, setPrimaryTenant] = useState<TenantData>({ full_name: "", email: "", phone: "" });
  const [secondaryTenant, setSecondaryTenant] = useState<TenantData | null>(null);

  // Redirect non-clients (allow staff org members who have client role)
  useEffect(() => {
    if (!authLoading && (!user || role !== "client")) {
      navigate("/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  // Determine if tier step is needed
  const needsTier = useMemo(
    () => selectedInspectionTypes.some((t) => serviceRequiresTier(t)),
    [selectedInspectionTypes],
  );

  // Determine if tenant step is needed (check_in only)
  const needsTenant = useMemo(
    () => selectedInspectionTypes.includes("check_in"),
    [selectedInspectionTypes],
  );

  // Build active steps — skip "tier" when not needed, skip "tenant" when not needed
  const STEPS = useMemo(
    () => ALL_STEPS.filter((s) => {
      if (s.key === "tier" && !needsTier) return false;
      if (s.key === "tenant" && !needsTenant) return false;
      return true;
    }),
    [needsTier, needsTenant],
  );

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || null;
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Reset tier when tier step is removed
  useEffect(() => {
    if (!needsTier) setSelectedTier("core");
  }, [needsTier]);

  const canProceed = () => {
    switch (currentStep) {
      case "inspection":
        return selectedInspectionTypes.length > 0;
      case "tier":
        return !!selectedTier && tierAcknowledged;
      case "size":
        return !!selectedSize;
      case "property":
        return !!selectedPropertyId;
      case "date":
        return !!selectedDate;
      case "tenant":
        // For check_in, primary tenant name is required
        if (needsTenant) return primaryTenant.full_name.trim().length > 0;
        return true;
      case "review":
        return detailsConfirmed && policyAcknowledged;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].key);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].key);
    } else {
      navigate("/dashboard");
    }
  };

  const handleCreateProperty = async (data: PropertyFormData) => {
    // Override size and furnishing from earlier steps
    data.property_type = selectedSize;
    data.furnished_status = selectedFurnishing;
    setIsCreatingProperty(true);
    const { error, data: newProperty } = await createProperty(data);
    setIsCreatingProperty(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (newProperty) {
      setSelectedPropertyId(newProperty.id);
      toast({ title: "Property Added", description: "Your property has been saved." });
    }
  };

  const handleSubmit = async () => {
    if (!selectedPropertyId || selectedInspectionTypes.length === 0 || !selectedDate || !detailsConfirmed || !policyAcknowledged) {
      toast({ title: "Missing Information", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const primaryType = selectedInspectionTypes[0];
    const additionalTypes = selectedInspectionTypes.slice(1);

    let instructions = specialInstructions;
    if (additionalTypes.length > 0) {
      const additionalNote = `[Additional services: ${additionalTypes.join(", ")}]`;
      instructions = instructions ? `${additionalNote}\n\n${instructions}` : additionalNote;
    }
    if (needsTier) {
      const tierNote = `[Service tier: ${selectedTier}]`;
      instructions = instructions ? `${tierNote}\n\n${instructions}` : tierNote;
    }

    const pricingProperty = {
      property_type: selectedSize,
      furnished_status: selectedFurnishing,
    } as any;

    const basePrice = calculateJobPrice(pricingProperty, selectedInspectionTypes, selectedTier);
    const shortNotice = isShortNotice(selectedDate);
    const quotedPrice = basePrice + (shortNotice ? SHORT_NOTICE_SURCHARGE : 0);

    const { error, data: newJob } = await createJob(
      {
        property_id: selectedPropertyId,
        inspection_type: primaryType,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        preferred_time_slot: selectedTimeSlot || undefined,
        special_instructions: instructions || undefined,
        quoted_price: quotedPrice,
        service_tier: selectedTier,
        tier_acknowledged_at: tierAcknowledged ? new Date().toISOString() : undefined,
        short_notice_surcharge_applied: shortNotice,
        policy_acknowledged_at: new Date().toISOString(),
      } as any,
      selectedProperty
        ? { address: selectedProperty.address_line_1, city: selectedProperty.city, postcode: selectedProperty.postcode, property_type: selectedProperty.property_type }
        : undefined,
    );

    // Save tenant details if provided
    if (!error && newJob?.id && (primaryTenant.full_name || primaryTenant.email || primaryTenant.phone)) {
      const tenantsToInsert: any[] = [
        { job_id: newJob.id, tenant_order: 1, full_name: primaryTenant.full_name || null, email: primaryTenant.email || null, phone: primaryTenant.phone || null },
      ];
      if (secondaryTenant && (secondaryTenant.full_name || secondaryTenant.email || secondaryTenant.phone)) {
        tenantsToInsert.push({
          job_id: newJob.id, tenant_order: 2, full_name: secondaryTenant.full_name || null, email: secondaryTenant.email || null, phone: secondaryTenant.phone || null,
        });
      }
      await supabase.from("tenant_details").insert(tenantsToInsert);
    }

    setIsSubmitting(false);

    if (error) {
      toast({ title: "Booking Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking Submitted!", description: "Your inventory request has been submitted." });
      navigate("/dashboard");
    }
  };

  if (authLoading || propertiesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {currentStepIndex === 0 ? "Dashboard" : "Back"}
          </button>
          <h1 className="text-lg font-bold text-foreground mt-1 tracking-tight">Book Inventory</h1>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 mb-2">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = step.key === currentStep;
              return (
                <button
                  key={step.key}
                  onClick={() => { if (isCompleted) setCurrentStep(step.key); }}
                  disabled={!isCompleted}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors",
                    isCompleted && "text-accent cursor-pointer hover:text-accent/80",
                    isCurrent && "text-foreground font-semibold",
                    !isCompleted && !isCurrent && "text-muted-foreground/50",
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      isCompleted && "bg-accent text-accent-foreground",
                      isCurrent && "bg-primary text-primary-foreground",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground/60",
                    )}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
          <Progress value={progressPercent} className="h-1" />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Step {currentStepIndex + 1} of {STEPS.length} — {STEPS[currentStepIndex].label}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-card rounded-xl border border-border p-5">
          {currentStep === "inspection" && (
            <InspectionTypeSelector
              selectedTypes={selectedInspectionTypes}
              onSelect={setSelectedInspectionTypes}
            />
          )}

          {currentStep === "tier" && (
            <div className="space-y-4">
              <TierSelector selectedTier={selectedTier} onSelect={(t) => { setSelectedTier(t); setTierAcknowledged(false); }} />
              <TierSummaryPanel selectedTier={selectedTier} />
              {/* Tier acknowledgement checkbox */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="tier_ack"
                  checked={tierAcknowledged}
                  onChange={(e) => setTierAcknowledged(e.target.checked)}
                  className="mt-0.5 accent-primary w-4 h-4 shrink-0 cursor-pointer"
                />
                <label htmlFor="tier_ack" className="text-xs text-foreground cursor-pointer leading-relaxed">
                  <span className="font-semibold">I understand the scope and coverage of the selected tier.</span>
                  <span className="block text-muted-foreground mt-0.5">
                    The inspection will be carried out according to the conditions of the {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} tier as described above.
                  </span>
                </label>
              </div>
            </div>
          )}

          {currentStep === "size" && (
            <PropertySizeSelector
              selectedSize={selectedSize}
              selectedFurnishing={selectedFurnishing}
              onSizeChange={setSelectedSize}
              onFurnishingChange={setSelectedFurnishing}
              inspectionTypes={selectedInspectionTypes}
              selectedTier={selectedTier}
            />
          )}

          {currentStep === "property" && (
            <PropertySelector
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onSelect={setSelectedPropertyId}
              onCreateProperty={handleCreateProperty}
              isCreating={isCreatingProperty}
            />
          )}

          {currentStep === "date" && (
            <DateTimeSelector
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              onDateChange={setSelectedDate}
              onTimeSlotChange={setSelectedTimeSlot}
            />
          )}

          {currentStep === "tenant" && (
            <TenantDetailsForm
              primaryTenant={primaryTenant}
              secondaryTenant={secondaryTenant}
              onPrimaryChange={setPrimaryTenant}
              onSecondaryChange={setSecondaryTenant}
              isCheckIn={selectedInspectionTypes.includes("check_in")}
            />
          )}

          {currentStep === "review" && (
            <BookingSummary
              property={selectedProperty}
              inspectionTypes={selectedInspectionTypes}
              selectedTier={selectedTier}
              scheduledDate={selectedDate}
              timeSlot={selectedTimeSlot}
              specialInstructions={specialInstructions}
              onInstructionsChange={setSpecialInstructions}
              detailsConfirmed={detailsConfirmed}
              onDetailsConfirmedChange={setDetailsConfirmed}
              policyAcknowledged={policyAcknowledged}
              onPolicyAcknowledgedChange={setPolicyAcknowledged}
              selectedSize={selectedSize}
              selectedFurnishing={selectedFurnishing}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-5">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            {currentStepIndex === 0 ? "Cancel" : "Back"}
          </Button>

          {currentStep === "review" ? (
            <Button
              variant="accent"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Booking
                  <Check className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          ) : (
            <Button size="sm" onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookJob;
