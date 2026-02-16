import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useXeroConnection = () => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const checkConnection = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_xero_connection');

      if (!error && data && data.length > 0) {
        setConnected(true);
        setTenantName(data[0].tenant_name);
      } else {
        setConnected(false);
        setTenantName(null);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const connectXero = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke("xero-authorize", {
        body: { redirect_uri: window.location.origin + "/xero/callback" },
      });

      if (response.error) {
        console.error("Xero authorize error:", response.error);
        return;
      }

      window.location.href = response.data.url;
    } catch (err) {
      console.error("Failed to initiate Xero connection:", err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectXero = async () => {
    if (!user) return;

    await supabase.from("xero_connections").delete().eq("user_id", user.id);
    setConnected(false);
    setTenantName(null);
  };

  useEffect(() => {
    checkConnection();
  }, [user]);

  return {
    connected,
    tenantName,
    loading,
    connecting,
    connectXero,
    disconnectXero,
    refresh: checkConnection,
  };
};
