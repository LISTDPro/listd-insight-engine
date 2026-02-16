import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface IssueStrikeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clerkUserId: string;
  clerkName: string;
  onSuccess?: () => void;
}

const IssueStrikeDialog = ({ open, onOpenChange, clerkUserId, clerkName, onSuccess }: IssueStrikeDialogProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState("1");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setLoading(true);

    const { error } = await (supabase as any)
      .from("strikes")
      .insert({
        clerk_id: clerkUserId,
        reason,
        severity: parseInt(severity),
        issued_by: user?.id,
      });

    setLoading(false);

    if (error) {
      toast.error("Failed to issue strike");
      return;
    }

    toast.success(`Strike issued to ${clerkName}`);
    setReason("");
    setSeverity("1");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <DialogTitle>Issue Strike</DialogTitle>
          </div>
          <DialogDescription>
            Issue a strike to <strong>{clerkName}</strong>. Strikes affect tier progression.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Warning (minor infraction)</SelectItem>
                <SelectItem value="2">2 — Serious (no-show, unprofessional conduct)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Describe the reason for this strike..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="bg-destructive/5 border border-destructive/20 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-destructive mb-1">Strike consequences:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>2 strikes → tier demotion</li>
              <li>3 strikes → 30-day suspension</li>
              <li>4 strikes → permanent ban</li>
              <li>Strikes expire after 6 months of good standing</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Issue Strike
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IssueStrikeDialog;
