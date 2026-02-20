import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Clock, Loader2, XCircle, PoundSterling } from "lucide-react";
import { differenceInHours } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface AdminCancelJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  scheduledDate: string;
  quotedPrice: number;
  status: string;
  onSuccess: () => void;
}

const getCancellationPolicy = (hoursUntil: number) => {
  if (hoursUntil > 48) {
    return {
      label: "No Charge",
      percentage: 0,
      color: "bg-success/10 text-success border-success/30",
    };
  } else if (hoursUntil > 24) {
    return {
      label: "50% Fee",
      percentage: 50,
      color: "bg-warning/10 text-warning border-warning/30",
    };
  } else {
    return {
      label: "75% Fee",
      percentage: 75,
      color: "bg-destructive/10 text-destructive border-destructive/30",
    };
  }
};

const AdminCancelJobDialog = ({
  open,
  onOpenChange,
  jobId,
  scheduledDate,
  quotedPrice,
  status,
  onSuccess,
}: AdminCancelJobDialogProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  const hoursUntil = differenceInHours(new Date(scheduledDate), new Date());
  const policy = getCancellationPolicy(hoursUntil);
  const fee = Math.round(quotedPrice * (policy.percentage / 100) * 100) / 100;

  const handleCancel = async () => {
    setCancelling(true);

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "cancelled" as any,
        cancelled_at: new Date().toISOString(),
        cancelled_by: profile?.user_id ?? null,
        cancellation_fee: fee,
        cancellation_reason: reason.trim() || null,
      } as any)
      .eq("id", jobId);

    setCancelling(false);

    if (error) {
      toast({ title: "Error cancelling job", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Job cancelled",
        description: fee > 0 ? `Cancellation fee of £${fee.toFixed(2)} applied.` : "No cancellation fee applied.",
      });
      onOpenChange(false);
      setReason("");
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            Cancel Job
          </DialogTitle>
          <DialogDescription>
            This will immediately set the job status to <strong>Cancelled</strong> and apply the calculated fee.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Time display */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {hoursUntil > 0
              ? `${hoursUntil}h until inspection`
              : `Inspection was ${Math.abs(hoursUntil)}h ago`}
          </div>

          {/* Policy breakdown */}
          <div className="bg-muted/40 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Policy applied</span>
              <Badge variant="outline" className={policy.color}>
                {policy.label}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <div className={`rounded p-1.5 text-center border ${hoursUntil > 48 ? "border-success/40 bg-success/10 text-success" : "border-border bg-muted/50 text-muted-foreground"}`}>
                <p className="font-semibold">&gt;48h</p>
                <p>No Charge</p>
              </div>
              <div className={`rounded p-1.5 text-center border ${hoursUntil > 24 && hoursUntil <= 48 ? "border-warning/40 bg-warning/10 text-warning" : "border-border bg-muted/50 text-muted-foreground"}`}>
                <p className="font-semibold">24–48h</p>
                <p>50% Fee</p>
              </div>
              <div className={`rounded p-1.5 text-center border ${hoursUntil <= 24 ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-muted/50 text-muted-foreground"}`}>
                <p className="font-semibold">&lt;24h</p>
                <p>75% Fee</p>
              </div>
            </div>
          </div>

          {/* Fee summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Booking Value</p>
              <p className="text-xl font-bold text-foreground">£{quotedPrice.toFixed(2)}</p>
            </div>
            <div className={`rounded-lg p-3 text-center ${fee > 0 ? "bg-destructive/5 border border-destructive/20" : "bg-success/5 border border-success/20"}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Fee ({policy.percentage}%)
              </p>
              <p className={`text-xl font-bold ${fee > 0 ? "text-destructive" : "text-success"}`}>
                £{fee.toFixed(2)}
              </p>
            </div>
          </div>

          {fee === 0 && (
            <div className="flex items-start gap-2 text-xs text-success bg-success/5 border border-success/20 rounded-lg p-2.5">
              <PoundSterling className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              No cancellation fee will be charged — more than 48 hours notice given.
            </div>
          )}

          {fee > 0 && (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-2.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              A cancellation fee of <strong>&nbsp;£{fee.toFixed(2)}&nbsp;</strong> will be recorded on this job.
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cancellation Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client requested cancellation, property no longer available..."
              className="text-sm resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelling}>
            Keep Job
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelling}
            className="gap-2"
          >
            {cancelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {fee > 0 ? `Cancel & Apply £${fee.toFixed(2)} Fee` : "Cancel Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCancelJobDialog;
