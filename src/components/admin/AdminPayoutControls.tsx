import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  PoundSterling,
  Lock,
  Unlock,
  CheckCircle2,
  Gift,
  Save,
  Loader2,
} from "lucide-react";

interface AdminPayoutControlsProps {
  jobId: string;
  clerkPayout: number;
  clerkBonus: number;
  clerkFinalPayout: number;
  clerkPayoutLocked: boolean;
  status: string;
  quotedPrice: number;
  margin: number;
  onUpdate: () => void;
}

const AdminPayoutControls = ({
  jobId,
  clerkPayout,
  clerkBonus,
  clerkFinalPayout,
  clerkPayoutLocked,
  status,
  quotedPrice,
  margin,
  onUpdate,
}: AdminPayoutControlsProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [payoutOverride, setPayoutOverride] = useState(clerkPayout.toString());
  const [bonusAmount, setBonusAmount] = useState(clerkBonus.toString());

  const calculatedFinal = (parseFloat(payoutOverride) || 0) + (parseFloat(bonusAmount) || 0);
  const calculatedMargin = quotedPrice - calculatedFinal;
  const isPaid = status === "paid";

  const handleSavePayout = async () => {
    if (clerkPayoutLocked) {
      toast({ title: "Payout is locked", description: "Unlock the payout before making changes.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const newPayout = parseFloat(payoutOverride) || 0;
    const newBonus = parseFloat(bonusAmount) || 0;
    const newFinal = newPayout + newBonus;
    const newMargin = quotedPrice - newFinal;

    const { error } = await supabase
      .from("jobs")
      .update({
        clerk_payout: newPayout,
        clerk_bonus: newBonus,
        clerk_final_payout: newFinal,
        margin: newMargin,
      } as any)
      .eq("id", jobId);

    setSaving(false);
    if (error) {
      toast({ title: "Error saving payout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout updated" });
      onUpdate();
    }
  };

  const handleToggleLock = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("jobs")
      .update({ clerk_payout_locked: !clerkPayoutLocked } as any)
      .eq("id", jobId);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: clerkPayoutLocked ? "Payout unlocked" : "Payout locked" });
      onUpdate();
    }
  };

  const handleMarkPaid = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("jobs")
      .update({
        status: "paid" as any,
        clerk_payout_locked: true,
        clerk_payment_date: new Date().toISOString(),
      } as any)
      .eq("id", jobId);

    setSaving(false);
    if (error) {
      toast({ title: "Error marking as paid", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job marked as Paid", description: "Payout has been locked automatically." });
      onUpdate();
    }
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <PoundSterling className="w-4 h-4 text-accent" />
          Admin Payout Controls
          {clerkPayoutLocked && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[10px]">
              <Lock className="w-3 h-3 mr-1" />
              Locked
            </Badge>
          )}
          {isPaid && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Paid
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Financial summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Client Price</p>
            <p className="text-lg font-bold text-foreground">£{quotedPrice.toFixed(0)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Clerk Payout</p>
            <p className="text-lg font-bold text-accent">£{calculatedFinal.toFixed(0)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Margin</p>
            <p className={`text-lg font-bold ${calculatedMargin >= 0 ? "text-success" : "text-destructive"}`}>
              £{calculatedMargin.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Clerk Base Payout (£)</Label>
            <Input
              type="number"
              value={payoutOverride}
              onChange={(e) => setPayoutOverride(e.target.value)}
              disabled={clerkPayoutLocked || isPaid}
              className="mt-1"
              min="0"
              step="1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Gift className="w-3 h-3" />
              Bonus Amount (£)
            </Label>
            <Input
              type="number"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              disabled={clerkPayoutLocked || isPaid}
              className="mt-1"
              min="0"
              step="1"
            />
          </div>
        </div>

        {/* Calculated final */}
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Final Payout (Base + Bonus)</span>
          <span className="text-lg font-bold text-accent">£{calculatedFinal.toFixed(2)}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSavePayout}
            disabled={saving || clerkPayoutLocked || isPaid}
            className="gap-1.5 flex-1"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Payout
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleLock}
            disabled={saving || isPaid}
            className="gap-1.5"
          >
            {clerkPayoutLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Lock
              </>
            )}
          </Button>
          {!isPaid && ["completed", "reviewed", "signed", "submitted"].includes(status) && (
            <Button
              size="sm"
              variant="accent"
              onClick={handleMarkPaid}
              disabled={saving}
              className="gap-1.5 flex-1"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Mark as Paid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPayoutControls;
