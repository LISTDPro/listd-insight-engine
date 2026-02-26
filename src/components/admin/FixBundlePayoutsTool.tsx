import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wrench, CheckCircle2, AlertTriangle } from "lucide-react";
import { calculateBundleClerkPayout, calculateMargin } from "@/utils/clerkPricing";
import { InspectionType } from "@/types/database";

interface FixBundlePayoutsToolProps {
  jobs: any[];
  onFixed: () => void;
}

interface FixCandidate {
  id: string;
  inspection_type: string;
  additional_services: string[];
  current_payout: number;
  correct_payout: number;
  property_type: string;
  service_tier: string;
  quoted_price: number;
}

const FixBundlePayoutsTool = ({ jobs, onFixed }: FixBundlePayoutsToolProps) => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [candidates, setCandidates] = useState<FixCandidate[]>([]);
  const [scanned, setScanned] = useState(false);

  const scanJobs = async () => {
    setScanning(true);
    setCandidates([]);

    // Fetch active jobs with properties
    const { data: jobsWithProps } = await supabase
      .from("jobs")
      .select("*, property:properties(*)")
      .not("status", "in", '("cancelled","draft")');

    if (!jobsWithProps) {
      setScanning(false);
      setScanned(true);
      return;
    }

    const fixes: FixCandidate[] = [];

    for (const job of jobsWithProps as any[]) {
      const instructions = job.special_instructions || "";
      const match = instructions.match(/\[Additional services:\s*(.+?)\]/);
      
      if (!match) continue;

      const additionalTypes = match[1].split(",").map((s: string) => s.trim()) as InspectionType[];
      const allTypes = [job.inspection_type as InspectionType, ...additionalTypes];
      const property = job.property;

      if (!property?.property_type) continue;

      try {
        const bundleResult = calculateBundleClerkPayout(
          allTypes,
          property.property_type,
          property,
          job.service_tier,
        );

        const currentPayout = job.clerk_payout || 0;
        
        // Only flag if there's a meaningful difference (> £1)
        if (Math.abs(bundleResult.grandTotal - currentPayout) > 1) {
          fixes.push({
            id: job.id,
            inspection_type: job.inspection_type,
            additional_services: additionalTypes,
            current_payout: currentPayout,
            correct_payout: bundleResult.grandTotal,
            property_type: property.property_type,
            service_tier: job.service_tier,
            quoted_price: job.quoted_price || 0,
          });
        }
      } catch (e) {
        console.warn(`Skipping job ${job.id}: ${e}`);
      }
    }

    setCandidates(fixes);
    setScanning(false);
    setScanned(true);
  };

  const fixAll = async () => {
    setFixing(true);
    let fixed = 0;

    for (const candidate of candidates) {
      const allTypes = [candidate.inspection_type as InspectionType, ...candidate.additional_services as InspectionType[]];
      
      // Re-fetch property for accurate add-ons
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*, property:properties(*)")
        .eq("id", candidate.id)
        .single();

      if (!jobData) continue;

      const property = (jobData as any).property;
      
      try {
        const bundleResult = calculateBundleClerkPayout(
          allTypes,
          property.property_type,
          property,
          candidate.service_tier,
        );

        const margin = calculateMargin(candidate.quoted_price, bundleResult.grandTotal);

        const { error } = await supabase
          .from("jobs")
          .update({
            clerk_payout: bundleResult.grandTotal,
            clerk_final_payout: bundleResult.grandTotal,
            clerk_payout_breakdown: {
              bundle: true,
              services: bundleResult.services,
              grandTotal: bundleResult.grandTotal,
              tier: bundleResult.tier,
              size: bundleResult.size,
            },
            margin,
            clerk_payout_log: [
              ...((jobData as any).clerk_payout_log || []),
              {
                timestamp: new Date().toISOString(),
                reason: "admin_bundle_fix",
                previous: candidate.current_payout,
                new: bundleResult.grandTotal,
              },
            ],
          } as any)
          .eq("id", candidate.id);

        if (!error) fixed++;
      } catch (e) {
        console.error(`Failed to fix job ${candidate.id}:`, e);
      }
    }

    setFixing(false);
    toast({
      title: `Fixed ${fixed} of ${candidates.length} jobs`,
      description: "Bundle payouts have been recalculated.",
    });
    setCandidates([]);
    setScanned(false);
    onFixed();
  };

  return (
    <Card className="border-warning/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Wrench className="w-4 h-4 text-warning" />
          Fix Bundle Payouts
          {candidates.length > 0 && (
            <Badge className="bg-warning/10 text-warning border-warning/30 text-[10px]">
              {candidates.length} need fixing
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Scan for jobs with bundled services that have incorrect clerk payouts.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={scanJobs}
            disabled={scanning}
            className="gap-1.5"
          >
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {scanning ? "Scanning..." : "Scan Jobs"}
          </Button>
          {candidates.length > 0 && (
            <Button
              size="sm"
              variant="accent"
              onClick={fixAll}
              disabled={fixing}
              className="gap-1.5"
            >
              {fixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {fixing ? "Fixing..." : `Fix All (${candidates.length})`}
            </Button>
          )}
        </div>

        {scanned && candidates.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" />
            All bundle payouts are correct.
          </div>
        )}

        {candidates.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {candidates.map((c) => (
              <div key={c.id} className="bg-muted/50 rounded-lg p-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{c.id.slice(0, 8)}...</p>
                  <p className="text-xs">
                    {c.inspection_type.replace(/_/g, " ")} + {c.additional_services.map(s => s.replace(/_/g, " ")).join(", ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{c.property_type} · {c.service_tier}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-destructive line-through">£{c.current_payout.toFixed(2)}</p>
                  <p className="text-sm font-bold text-success">£{c.correct_payout.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FixBundlePayoutsTool;