import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useXeroInvoice = () => {
  const [creating, setCreating] = useState(false);

  const createInvoice = async (jobId: string) => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to create invoices");
        return { success: false };
      }

      const response = await supabase.functions.invoke("xero-create-invoice", {
        body: { job_id: jobId },
      });

      if (response.error) {
        const errorMsg = response.error.message || "Failed to create invoice";
        // Check if it's a Xero connection issue
        if (errorMsg.includes("No Xero connection") || errorMsg.includes("reconnect")) {
          toast.error("Xero not connected", {
            description: "Please connect your Xero account in Settings first.",
          });
        } else {
          toast.error("Invoice creation failed", { description: errorMsg });
        }
        return { success: false, error: errorMsg };
      }

      const data = response.data;
      toast.success("Xero invoice created!", {
        description: `Invoice ${data.invoice_number || data.reference} for £${data.amount?.toFixed(2)}`,
      });

      return { success: true, data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create Xero invoice", { description: msg });
      return { success: false, error: msg };
    } finally {
      setCreating(false);
    }
  };

  return { createInvoice, creating };
};
