import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, RefreshCw, Users } from "lucide-react";
import { format } from "date-fns";

interface WaitlistLead {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string | null;
  role: string;
  portfolio_size: string | null;
  monthly_volume: string | null;
  created_at: string;
  notes: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  Agent: "bg-blue-100 text-blue-800",
  Landlord: "bg-primary/10 text-primary",
  "Block Manager": "bg-purple-100 text-purple-800",
};

const WaitlistLeadsPanel = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<WaitlistLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("waitlist_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setLeads(data as WaitlistLead[]);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ["Name", "Company", "Email", "Phone", "Role", "Portfolio Size", "Monthly Volume", "Submitted"];
    const rows = leads.map((l) => [
      l.full_name,
      l.company_name,
      l.email,
      l.phone || "",
      l.role,
      l.portfolio_size || "",
      l.monthly_volume || "",
      format(new Date(l.created_at), "dd/MM/yyyy HH:mm"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waitlist-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Early Access Waitlist
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{leads.length} lead{leads.length !== 1 ? "s" : ""} collected</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={leads.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Portfolio</TableHead>
              <TableHead>Monthly Vol.</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Loading...</TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                  No waitlist leads yet
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium text-sm">{lead.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.company_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded ${ROLE_COLORS[lead.role] || "bg-muted text-muted-foreground"}`}>
                      {lead.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.portfolio_size || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.monthly_volume || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(lead.created_at), "d MMM yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WaitlistLeadsPanel;
