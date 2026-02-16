import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Scale } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DisputeResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: {
    id: string;
    job_id: string;
    reason: string;
    description: string | null;
    raised_by: string;
    raised_against: string;
  };
  onSuccess?: () => void;
}

const resolutionOptions = [
  { value: "refund_client", label: "Full Refund to Client" },
  { value: "pay_clerk", label: "Full Payment to Clerk" },
  { value: "split", label: "Split Decision (50/50)" },
  { value: "resubmission", label: "Require Resubmission" },
];

const DisputeResolutionDialog = ({ open, onOpenChange, dispute, onSuccess }: DisputeResolutionDialogProps) => {
  const { user } = useAuth();
  const [resolution, setResolution] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [issueStrike, setIssueStrike] = useState(false);
  const [strikeReason, setStrikeReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!resolution) {
      toast.error("Please select a resolution");
      return;
    }

    setLoading(true);

    const resolutionLabel = resolutionOptions.find(o => o.value === resolution)?.label || resolution;

    // Update dispute
    const { error: disputeErr } = await (supabase as any)
      .from("disputes")
      .update({
        status: "resolved",
        resolution: resolutionLabel,
        admin_notes: adminNotes || null,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
      })
      .eq("id", dispute.id);

    if (disputeErr) {
      toast.error("Failed to resolve dispute");
      setLoading(false);
      return;
    }

    // Issue strike if checked
    if (issueStrike && strikeReason) {
      await (supabase as any)
        .from("strikes")
        .insert({
          clerk_id: dispute.raised_against,
          reason: strikeReason,
          issued_by: user?.id,
          severity: 1,
        });
    }

    setLoading(false);
    toast.success("Dispute resolved successfully");
    setResolution("");
    setAdminNotes("");
    setIssueStrike(false);
    setStrikeReason("");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-warning" />
            <DialogTitle>Resolve Dispute</DialogTitle>
          </div>
          <DialogDescription>
            {dispute.reason}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {dispute.description && (
            <div className="bg-muted/50 p-3 text-sm text-muted-foreground">
              {dispute.description}
            </div>
          )}

          <div className="space-y-3">
            <Label className="font-medium">Admin Decision</Label>
            <RadioGroup value={resolution} onValueChange={setResolution} className="space-y-2">
              {resolutionOptions.map((opt) => (
                <div key={opt.value} className="flex items-center gap-3 p-3 border border-border hover:border-primary/30 transition-colors">
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value} className="cursor-pointer flex-1">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="strike"
                checked={issueStrike}
                onCheckedChange={(c) => setIssueStrike(c as boolean)}
              />
              <Label htmlFor="strike" className="cursor-pointer text-sm">
                Issue strike to clerk — poor quality work
              </Label>
            </div>
            {issueStrike && (
              <Textarea
                placeholder="Strike reason..."
                value={strikeReason}
                onChange={(e) => setStrikeReason(e.target.value)}
                rows={2}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              placeholder="Admin notes (not visible to users)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !resolution}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisputeResolutionDialog;
