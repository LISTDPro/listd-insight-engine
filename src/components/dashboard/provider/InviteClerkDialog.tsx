import { useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useClerkInvitations } from "@/hooks/useClerkInvitations";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

interface InviteClerkDialogProps {
  children?: React.ReactNode;
}

const InviteClerkDialog = ({ children }: InviteClerkDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { sendInvitation } = useClerkInvitations();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    // Validate email
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }

    setSending(true);
    const { error } = await sendInvitation(email.trim());
    setSending(false);

    if (error) {
      // Handle duplicate invitation
      if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
        toast({
          title: "Invitation already sent",
          description: "An invitation has already been sent to this email address.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to send invitation",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Invitation sent!",
      description: `An invitation email has been sent to ${email}`,
    });
    setEmail("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            Invite Clerk
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a Clerk</DialogTitle>
          <DialogDescription>
            Send an email invitation to a clerk to join your team. They'll receive a link to create an account and connect with you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="clerk@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              disabled={sending}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending || !email.trim()}>
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteClerkDialog;
