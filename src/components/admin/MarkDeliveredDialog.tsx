import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";

interface MarkDeliveredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onSuccess?: () => void;
}

const MarkDeliveredDialog = ({ open, onOpenChange, jobId, onSuccess }: MarkDeliveredDialogProps) => {
  const [inventorybaseJobId, setInventorybaseJobId] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reportUrl) {
      toast.error("Report URL is required");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "submitted" as any,
        inventorybase_job_id: inventorybaseJobId || null,
        report_url: reportUrl,
        delivered_at: completedAt ? new Date(completedAt).toISOString() : new Date().toISOString(),
        special_instructions: adminNotes
          ? `[Admin Note] ${adminNotes}`
          : undefined,
      } as any)
      .eq("id", jobId);

    setLoading(false);

    if (error) {
      toast.error("Failed to mark job as delivered");
      return;
    }

    toast.success("Job marked as delivered — client notified");
    setInventorybaseJobId("");
    setReportUrl("");
    setCompletedAt("");
    setAdminNotes("");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-primary" />
            <DialogTitle>Mark as Delivered</DialogTitle>
          </div>
          <DialogDescription>
            Bridge this job from InventoryBase. The client will be notified to review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>InventoryBase Job ID</Label>
            <Input
              placeholder="e.g. ib-12345"
              value={inventorybaseJobId}
              onChange={(e) => setInventorybaseJobId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Report URL <span className="text-destructive">*</span></Label>
            <Input
              placeholder="https://reports.inventorybase.co.uk/..."
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Completed At</Label>
            <Input
              type="datetime-local"
              value={completedAt}
              onChange={(e) => setCompletedAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Admin Notes (internal)</Label>
            <Textarea
              placeholder="Optional internal notes..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !reportUrl}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update & Notify Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkDeliveredDialog;
