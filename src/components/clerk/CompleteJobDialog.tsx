import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CompleteJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  propertyAddress: string;
  clientId: string;
  onCompleted: () => void;
}

const CompleteJobDialog = ({
  open,
  onOpenChange,
  jobId,
  propertyAddress,
  clientId,
  onCompleted,
}: CompleteJobDialogProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);

    const { error: jobError } = await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", jobId)
      .eq("clerk_id", user.id);

    if (jobError) {
      toast({ title: "Error", description: jobError.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Notify the client
    await supabase.from("notifications").insert({
      user_id: clientId,
      type: "job",
      title: "Inspection Completed",
      message: `Your inspection at ${propertyAddress} has been completed by your clerk.${notes ? ` Notes: ${notes}` : ""}`,
      link: `/dashboard/jobs/${jobId}`,
    });

    toast({ title: "Job marked as complete" });
    setNotes("");
    onOpenChange(false);
    onCompleted();
    setSubmitting(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark Job as Complete?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to mark this job as complete? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Any notes for the client? (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-2"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Confirm Complete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CompleteJobDialog;
