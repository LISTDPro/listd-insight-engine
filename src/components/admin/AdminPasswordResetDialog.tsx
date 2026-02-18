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
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  user: { userId: string; name: string | null; email: string | null } | null;
  onClose: () => void;
}

const AdminPasswordResetDialog = ({ user, onClose }: Props) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!user?.email) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: {
          email: user.email,
          redirectUrl: window.location.origin + "/reset-password",
        },
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Reset link sent",
        description: `Password reset email sent to ${user.email}`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to send reset link",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    onClose();
  };

  return (
    <Dialog open={!!user} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-warning" />
            Send Password Reset
          </DialogTitle>
          <DialogDescription>
            Send a password reset link to{" "}
            <span className="font-medium text-foreground">
              {user?.name || user?.email}
            </span>
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-success" />
            <p className="text-sm font-medium text-foreground">Reset link sent!</p>
            <p className="text-xs text-muted-foreground">
              An email has been dispatched to{" "}
              <span className="font-medium">{user?.email}</span>
            </p>
          </div>
        ) : (
          <div className="py-2">
            <div className="bg-muted rounded-md px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                A secure reset link will be emailed to:
              </p>
              <p className="font-medium text-foreground mt-1">{user?.email}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              The link expires in 1 hour. The user will be prompted to set a new password.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} size="sm">
            {sent ? "Close" : "Cancel"}
          </Button>
          {!sent && (
            <Button
              variant="accent"
              size="sm"
              onClick={handleSend}
              disabled={sending || !user?.email}
              className="gap-2"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              {sending ? "Sending..." : "Send Reset Link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPasswordResetDialog;
