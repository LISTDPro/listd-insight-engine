import { useState } from "react";
import { FileText, ExternalLink, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TermsAgreementModalProps {
  userId: string;
  onAgreed: () => void;
}

const TERMS_URL = "https://forms.gle/oZZvtLZw4ztiy23j7";

const TermsAgreementModal = ({ userId, onAgreed }: TermsAgreementModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const { toast } = useToast();

  const handleOpenTerms = () => {
    window.open(TERMS_URL, "_blank", "noopener,noreferrer");
    setHasOpened(true);
  };

  const handleConfirmSigned = async () => {
    if (!hasConfirmed) {
      toast({
        title: "Please confirm",
        description: "You must check the box to confirm you've signed the agreement.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ terms_agreed_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save your agreement. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Terms Accepted",
      description: "Thank you for agreeing to our Terms of Business. You can now book jobs.",
    });
    
    onAgreed();
    setIsLoading(false);
  };

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle className="text-xl">Terms of Business Agreement Required</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Before you can book inventory jobs, you must review and sign our Terms of Business Agreement. This is a mandatory requirement for all clients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Please complete these steps:</p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Click the button below to open the agreement form</li>
              <li>Read and complete the Google Form</li>
              <li>Return here and confirm you've signed</li>
            </ol>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleOpenTerms}
          >
            <FileText className="h-4 w-4" />
            Open Terms of Business Agreement
            <ExternalLink className="h-3 w-3" />
          </Button>

          {hasOpened && (
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="confirm-signed"
                checked={hasConfirmed}
                onCheckedChange={(checked) => setHasConfirmed(checked === true)}
              />
              <label
                htmlFor="confirm-signed"
                className="text-sm text-foreground leading-tight cursor-pointer"
              >
                I confirm that I have read, understood, and signed the Terms of Business Agreement
              </label>
            </div>
          )}

          <Button
            variant="accent"
            className="w-full mt-4"
            onClick={handleConfirmSigned}
            disabled={!hasOpened || !hasConfirmed || isLoading}
          >
            {isLoading ? "Saving..." : "Continue to Dashboard"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAgreementModal;
