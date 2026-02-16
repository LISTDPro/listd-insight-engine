import { useState } from "react";
import { Shield, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NonCircumventionAgreementProps {
  userId: string;
  onAgreed: () => void;
}

const NonCircumventionAgreement = ({ userId, onAgreed }: NonCircumventionAgreementProps) => {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("profiles")
      .update({ non_circumvention_agreed_at: new Date().toISOString() } as any)
      .eq("user_id", userId);

    setSubmitting(false);

    if (error) {
      toast.error("Failed to save agreement. Please try again.");
    } else {
      toast.success("Agreement accepted. Welcome to the platform!");
      onAgreed();
    }
  };

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">
            Non-Circumvention Agreement
          </h3>
        </div>

        <div className="space-y-3 text-[12px] text-muted-foreground leading-relaxed">
          <p>
            By using the LISTD platform as a clerk, you agree to the following
            non-circumvention terms:
          </p>
          <ul className="space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 mt-0.5 text-warning shrink-0" />
              You will not solicit or accept direct work from clients sourced
              through LISTD outside of the platform.
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 mt-0.5 text-warning shrink-0" />
              Client contact information is provided solely for the purpose of
              conducting the assigned inspection.
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 mt-0.5 text-warning shrink-0" />
              Breach of these terms may result in account suspension and
              forfeiture of pending payouts.
            </li>
          </ul>
        </div>

        <div className="flex items-start gap-2.5 pt-2 border-t border-border">
          <Checkbox
            id="non-circumvention"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="non-circumvention"
            className="text-[11px] text-foreground cursor-pointer leading-relaxed"
          >
            I have read and agree to the LISTD Non-Circumvention Agreement and
            understand that my client interactions are monitored and must remain
            on-platform.
          </label>
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!agreed || submitting}
          className="w-full gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          {submitting ? "Saving..." : "Accept Agreement"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NonCircumventionAgreement;
