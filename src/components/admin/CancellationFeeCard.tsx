import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { differenceInHours } from "date-fns";
import { AlertTriangle, Clock, PoundSterling, Save, Loader2, ShieldOff, CheckCircle2, XCircle } from "lucide-react";
import AdminCancelJobDialog from "@/components/admin/AdminCancelJobDialog";

interface CancellationFeeCardProps {
  jobId: string;
  scheduledDate: string;
  quotedPrice: number;
  currentCancellationFee: number;
  status: string;
  cancelledAt?: string | null;
  onUpdate: () => void;
}

const getCancellationPolicy = (hoursUntilInspection: number) => {
  if (hoursUntilInspection > 48) {
    return { label: "No Charge", percentage: 0, color: "bg-success/10 text-success border-success/30", severity: "none" };
  } else if (hoursUntilInspection > 24) {
    return { label: "50% Fee", percentage: 50, color: "bg-warning/10 text-warning border-warning/30", severity: "medium" };
  } else {
    return { label: "75% Fee", percentage: 75, color: "bg-destructive/10 text-destructive border-destructive/30", severity: "high" };
  }
};

const CancellationFeeCard = ({
  jobId,
  scheduledDate,
  quotedPrice,
  currentCancellationFee,
  status,
  cancelledAt,
  onUpdate,
}: CancellationFeeCardProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [overrideFee, setOverrideFee] = useState(currentCancellationFee.toString());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Calculate hours until inspection from NOW (or from cancellation time if already cancelled)
  const referenceTime = cancelledAt ? new Date(cancelledAt) : new Date();
  const inspectionDate = new Date(scheduledDate);
  const hoursUntilInspection = differenceInHours(inspectionDate, referenceTime);

  const policy = getCancellationPolicy(hoursUntilInspection);
  const calculatedFee = (quotedPrice * policy.percentage) / 100;
  const overrideFeeNum = parseFloat(overrideFee) || 0;
  const isCancelled = status === "cancelled";

  const handleSaveOverride = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("jobs")
      .update({ cancellation_fee: overrideFeeNum } as any)
      .eq("id", jobId);

    setSaving(false);
    if (error) {
      toast({ title: "Error saving cancellation fee", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cancellation fee updated" });
      onUpdate();
    }
  };

  const handleWaiveFee = async () => {
    setSaving(true);
    setOverrideFee("0");
    const { error } = await supabase
      .from("jobs")
      .update({ cancellation_fee: 0 } as any)
      .eq("id", jobId);

    setSaving(false);
    if (error) {
      toast({ title: "Error waiving fee", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cancellation fee waived" });
      onUpdate();
    }
  };

  const handleApplyCalculated = () => {
    setOverrideFee(calculatedFee.toFixed(2));
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          Cancellation Fee
          <Badge variant="outline" className={policy.color}>
            {policy.label}
          </Badge>
          {currentCancellationFee === 0 && isCancelled && (
            <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
              Waived
            </Badge>
          )}
          {currentCancellationFee > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
              £{currentCancellationFee.toFixed(2)} Applied
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Time proximity breakdown */}
        <div className="bg-muted/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isCancelled && cancelledAt
                ? `Cancelled ${Math.abs(hoursUntilInspection)}h ${hoursUntilInspection < 0 ? "after" : "before"} inspection`
                : hoursUntilInspection > 0
                ? `${hoursUntilInspection}h until inspection`
                : `Inspection was ${Math.abs(hoursUntilInspection)}h ago`}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <div className={`rounded p-1.5 text-center border ${hoursUntilInspection > 48 ? "border-success/40 bg-success/10 text-success" : "border-border bg-muted/50 text-muted-foreground"}`}>
              <p className="font-semibold">&gt;48h</p>
              <p>No Charge</p>
            </div>
            <div className={`rounded p-1.5 text-center border ${hoursUntilInspection > 24 && hoursUntilInspection <= 48 ? "border-warning/40 bg-warning/10 text-warning" : "border-border bg-muted/50 text-muted-foreground"}`}>
              <p className="font-semibold">24–48h</p>
              <p>50% Fee</p>
            </div>
            <div className={`rounded p-1.5 text-center border ${hoursUntilInspection <= 24 ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-muted/50 text-muted-foreground"}`}>
              <p className="font-semibold">&lt;24h</p>
              <p>75% Fee</p>
            </div>
          </div>
        </div>

        {/* Calculated fee */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Booking Value</p>
            <p className="text-lg font-bold text-foreground">£{quotedPrice.toFixed(2)}</p>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Policy Fee ({policy.percentage}%)</p>
            <p className="text-lg font-bold text-destructive">£{calculatedFee.toFixed(2)}</p>
          </div>
        </div>

        {/* Admin override */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <PoundSterling className="w-3 h-3" />
              Admin Override Fee (£)
            </Label>
            {calculatedFee > 0 && (
              <button
                onClick={handleApplyCalculated}
                className="text-[10px] text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Apply calculated (£{calculatedFee.toFixed(2)})
              </button>
            )}
          </div>
          <Input
            type="number"
            value={overrideFee}
            onChange={(e) => setOverrideFee(e.target.value)}
            min="0"
            step="0.01"
            className="mt-1"
            placeholder="0.00"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveOverride}
            disabled={saving || isCancelled}
            className="gap-1.5 flex-1"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Fee
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleWaiveFee}
            disabled={saving || overrideFeeNum === 0}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Waive
          </Button>
        </div>

        {overrideFeeNum !== calculatedFee && overrideFeeNum >= 0 && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            {overrideFeeNum === 0
              ? "Fee will be waived (admin discretion)"
              : `Override: £${overrideFeeNum.toFixed(2)} (policy: £${calculatedFee.toFixed(2)})`}
          </p>
        )}

        {/* Cancel Job — only for active jobs */}
        {!isCancelled && (
          <>
            <div className="border-t border-border pt-3">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
                className="w-full gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Job
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Auto-calculates fee · Sets status to Cancelled
              </p>
            </div>

            <AdminCancelJobDialog
              open={cancelDialogOpen}
              onOpenChange={setCancelDialogOpen}
              jobId={jobId}
              scheduledDate={scheduledDate}
              quotedPrice={quotedPrice}
              status={status}
              onSuccess={onUpdate}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CancellationFeeCard;
