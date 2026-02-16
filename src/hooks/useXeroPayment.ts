import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useXeroPayment = () => {
  const [recording, setRecording] = useState(false);

  const recordPayment = async (jobId: string, amount?: number) => {
    setRecording(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to record payments");
        return { success: false };
      }

      const response = await supabase.functions.invoke("xero-record-payment", {
        body: { job_id: jobId, amount },
      });

      if (response.error) {
        const errorMsg = response.error.message || "Failed to record payment";
        if (errorMsg.includes("No Xero connection") || errorMsg.includes("reconnect")) {
          toast.error("Xero not connected", {
            description: "Please connect your Xero account in Settings first.",
          });
        } else if (errorMsg.includes("No matching Xero invoice")) {
          toast.error("No invoice found", {
            description: "Create the Xero invoice first before recording a payment.",
          });
        } else {
          toast.error("Payment sync failed", { description: errorMsg });
        }
        return { success: false, error: errorMsg };
      }

      const data = response.data;
      toast.success("Payment recorded in Xero!", {
        description: `Payment of £${data.amount?.toFixed(2)} against invoice ${data.invoice_number || data.reference}`,
      });

      return { success: true, data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to sync payment to Xero", { description: msg });
      return { success: false, error: msg };
    } finally {
      setRecording(false);
    }
  };

  return { recordPayment, recording };
};
