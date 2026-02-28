import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2, X } from "lucide-react";
import { SHORT_NOTICE_SURCHARGE } from "@/components/booking/BookingSummary";
import { calculateMargin } from "@/utils/clerkPricing";

interface AdminSurchargeOverrideProps {
  jobId: string;
  shortNoticeSurchargeApplied: boolean;
  quotedPrice: number;
  clerkPayout: number;
  onUpdate: () => void;
}

const AdminSurchargeOverride = ({
  jobId,
  shortNoticeSurchargeApplied,
  quotedPrice,
  clerkPayout,
  onUpdate,
}: AdminSurchargeOverrideProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  if (!shortNoticeSurchargeApplied) return null;

  const handleRemoveSurcharge = async () => {
    setSaving(true);

    const newClientPrice = quotedPrice - SHORT_NOTICE_SURCHARGE;
    const newMargin = calculateMargin(newClientPrice, clerkPayout);

    const { error } = await supabase
      .from("jobs")
      .update({
        short_notice_surcharge_applied: false,
        quoted_price: newClientPrice,
        margin: newMargin,
      } as any)
      .eq("id", jobId);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Surcharge removed", description: `Client price reduced by £${SHORT_NOTICE_SURCHARGE}. Margin recalculated.` });
      onUpdate();
    }
  };

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          Short-Notice Surcharge Applied
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          A £{SHORT_NOTICE_SURCHARGE} short-notice surcharge was applied to this booking. 
          Removing it will reduce the client price and recalculate the margin. Clerk payout remains unchanged.
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">Current price: <strong>£{quotedPrice}</strong></span>
          <span className="text-muted-foreground">→ After removal: <strong>£{quotedPrice - SHORT_NOTICE_SURCHARGE}</strong></span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRemoveSurcharge}
          disabled={saving}
          className="gap-1.5 text-xs"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          Remove Surcharge
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminSurchargeOverride;
