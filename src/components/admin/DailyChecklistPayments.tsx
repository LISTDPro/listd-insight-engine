import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useXeroPayment } from "@/hooks/useXeroPayment";
import { useXeroConnection } from "@/hooks/useXeroConnection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle2, CreditCard, FileSpreadsheet } from "lucide-react";

interface EscrowRow {
  id: string;
  job_id: string;
  client_id: string;
  clerk_id: string | null;
  gross_amount: number;
  platform_fee: number;
  clerk_payout: number;
  status: string;
  created_at: string;
}

const DailyChecklistPayments = () => {
  const { toast } = useToast();
  const { recordPayment, recording: recordingPayment } = useXeroPayment();
  const { connected: xeroConnected } = useXeroConnection();
  const [payments, setPayments] = useState<EscrowRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("escrow_payments")
      .select("*")
      .in("status", ["pending", "held"])
      .order("created_at", { ascending: false });
    if (data) setPayments(data as EscrowRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const releasePayment = async (paymentId: string, jobId: string, grossAmount: number) => {
    const { error } = await supabase
      .from("escrow_payments")
      .update({ status: "released", released_at: new Date().toISOString() } as any)
      .eq("id", paymentId);

    if (!error) {
      toast({ title: "Payment released" });
      // Auto-sync to Xero if connected
      if (xeroConnected) {
        await recordPayment(jobId, grossAmount);
      }
      fetchPayments();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return null;

  return (
    <div className="bg-card border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-success" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Payments Pending Approval</h3>
          <p className="text-xs text-muted-foreground">Escrow payments awaiting release to clerks</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {payments.length}
        </Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Payment ID</TableHead>
            <TableHead>Job</TableHead>
            <TableHead>Gross</TableHead>
            <TableHead>Platform Fee</TableHead>
            <TableHead>Clerk Payout</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-6 text-sm">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" />
                No payments pending approval
              </TableCell>
            </TableRow>
          ) : (
            payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}...</TableCell>
                <TableCell className="font-mono text-xs">{p.job_id.slice(0, 8)}...</TableCell>
                <TableCell className="text-sm font-medium">£{Number(p.gross_amount).toFixed(2)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">£{Number(p.platform_fee).toFixed(2)}</TableCell>
                <TableCell className="text-sm font-medium text-success">£{Number(p.clerk_payout).toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${
                    p.status === "held" ? "bg-accent/30 text-accent-foreground" : "bg-warning/10 text-warning"
                  }`}>
                    {p.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" className="text-xs bg-success text-success-foreground hover:bg-success/90" disabled={recordingPayment} onClick={() => releasePayment(p.id, p.job_id, Number(p.gross_amount))}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {recordingPayment ? "Syncing..." : "Release"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DailyChecklistPayments;
