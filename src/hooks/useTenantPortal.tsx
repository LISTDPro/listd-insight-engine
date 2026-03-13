import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TenantInfo {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  job_id: string;
}

interface PropertyInfo {
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
}

interface JobInfo {
  id: string;
  inspection_type: string;
  scheduled_date: string;
  status: string;
}

interface ReportInfo {
  id: string;
  job_id: string;
  generated_at: string;
  report_url: string | null;
  tenant_signature: string | null;
  signed_at: string | null;
}

interface TenantPortalContextType {
  token: string | null;
  tenant: TenantInfo | null;
  property: PropertyInfo | null;
  job: JobInfo | null;
  reports: ReportInfo[];
  loading: boolean;
  invalid: boolean;
  refresh: () => Promise<void>;
}

const TenantPortalContext = createContext<TenantPortalContextType | undefined>(undefined);

export const TenantPortalProvider = ({ token, children }: { token: string | null; children: ReactNode }) => {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [reports, setReports] = useState<ReportInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const fetchData = async () => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("tenant_portal_data", { _token: token });

    if (error || !data) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    setTenant(parsed.tenant);
    setProperty(parsed.property);
    setJob(parsed.job);
    setReports(parsed.reports || []);
    setInvalid(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <TenantPortalContext.Provider value={{ token, tenant, property, job, reports, loading, invalid, refresh: fetchData }}>
      {children}
    </TenantPortalContext.Provider>
  );
};

export const useTenantPortal = () => {
  const ctx = useContext(TenantPortalContext);
  if (!ctx) throw new Error("useTenantPortal must be used within TenantPortalProvider");
  return ctx;
};
