import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, FileCheck, Loader2, PenLine } from "lucide-react";
import SignatureCanvas from "@/components/ui/SignatureCanvas";

interface AcknowledgementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  type: "pre_inspection" | "report_acceptance";
  propertyAddress: string;
  city?: string;
  postcode?: string;
  inspectionType?: string;
  scheduledDate?: string;
  clientName?: string;
  onSuccess?: () => void;
}

const AcknowledgementDialog = ({
  open,
  onOpenChange,
  jobId,
  type,
  propertyAddress,
  city,
  postcode,
  inspectionType,
  scheduledDate,
  clientName,
  onSuccess,
}: AcknowledgementDialogProps) => {
  const [agreed, setAgreed] = useState(false);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const isPreInspection = type === "pre_inspection";

  const handleSubmit = async () => {
    if (!agreed) {
      toast.error("Please confirm you agree to the terms");
      return;
    }
    if (!isPreInspection && !signatureDataUrl) {
      toast.error("Please provide your signature");
      return;
    }

    setLoading(true);
    
    const updates = isPreInspection 
      ? {
          client_pre_inspection_ack: true,
          client_pre_inspection_ack_at: new Date().toISOString(),
        }
      : {
          client_report_accepted: true,
          client_report_accepted_at: new Date().toISOString(),
          client_report_comments: comments || null,
          client_signature_url: signatureDataUrl,
          client_signature_at: new Date().toISOString(),
        };

    const { error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", jobId);

    setLoading(false);

    if (error) {
      toast.error("Failed to submit acknowledgement");
      return;
    }

    // Send notification for pre-inspection acknowledgement
    if (isPreInspection) {
      try {
        await supabase.functions.invoke("notify-pre-inspection-ack", {
          body: {
            jobId,
            propertyAddress,
            city: city || "",
            postcode: postcode || "",
            inspectionType: inspectionType || "",
            scheduledDate: scheduledDate || "",
            clientName: clientName || "",
          },
        });
        console.log("Pre-inspection ack notification sent");
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
      }
    }

    toast.success(
      isPreInspection 
        ? "Pre-inspection acknowledgement confirmed" 
        : "Report accepted successfully"
    );
    
    setAgreed(false);
    setComments("");
    setSignatureDataUrl(null);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {isPreInspection ? (
              <Shield className="w-5 h-5 text-primary" />
            ) : (
              <FileCheck className="w-5 h-5 text-success" />
            )}
            <DialogTitle>
              {isPreInspection ? "Pre-Inspection Acknowledgement" : "Accept Report"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isPreInspection 
              ? `Confirm the information provided for ${propertyAddress} is accurate.`
              : `Review and accept the inspection report for ${propertyAddress}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPreInspection ? (
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">By confirming, you acknowledge that:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>The property details provided are accurate</li>
                <li>The room counts and furnishing status are correct</li>
                <li>You have access to arrange entry for the inspection</li>
                <li>Any special instructions have been noted</li>
              </ul>
            </div>
          ) : (
            <>
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium">By accepting, you confirm that:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>You have reviewed the inspection report</li>
                  <li>The report accurately reflects the property condition</li>
                  <li>You approve the report for record purposes</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comments">Comments (optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any additional comments or notes..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-primary" />
                  <Label>Digital Signature <span className="text-destructive">*</span></Label>
                </div>
                <SignatureCanvas onSignatureChange={setSignatureDataUrl} />
              </div>
            </>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <Label htmlFor="agree" className="text-sm leading-relaxed cursor-pointer">
              {isPreInspection 
                ? "I confirm that all information provided is accurate and complete to the best of my knowledge."
                : "I have reviewed and accept the inspection report."}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!agreed || loading || (!isPreInspection && !signatureDataUrl)}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isPreInspection ? "Confirm Details" : "Accept Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AcknowledgementDialog;
