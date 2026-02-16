import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Clerk {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export const useClerks = () => {
  const { user } = useAuth();
  const [clerks, setClerks] = useState<Clerk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClerks = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    // Fetch profiles where provider_id matches current user
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, phone, avatar_url")
      .eq("provider_id", user.id);

    if (fetchError) {
      setError(fetchError.message);
      setClerks([]);
    } else {
      setClerks(data as Clerk[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClerks();
  }, [user]);

  const addClerk = async (clerkUserId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ provider_id: user.id })
      .eq("user_id", clerkUserId);

    if (!updateError) {
      await fetchClerks();
    }

    return { error: updateError as Error | null };
  };

  const removeClerk = async (clerkUserId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ provider_id: null })
      .eq("user_id", clerkUserId)
      .eq("provider_id", user.id);

    if (!updateError) {
      await fetchClerks();
    }

    return { error: updateError as Error | null };
  };

  return {
    clerks,
    loading,
    error,
    fetchClerks,
    addClerk,
    removeClerk,
  };
};
