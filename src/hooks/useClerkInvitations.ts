import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ClerkInvitation {
  id: string;
  provider_id: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export const useClerkInvitations = () => {
  const { user, profile } = useAuth();
  const [invitations, setInvitations] = useState<ClerkInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("clerk_invitations")
      .select("*")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setInvitations([]);
    } else {
      setInvitations(data as ClerkInvitation[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const sendInvitation = async (email: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    // First, create the invitation in the database
    const { data: invitation, error: insertError } = await supabase
      .from("clerk_invitations")
      .insert({
        provider_id: user.id,
        email: email.toLowerCase().trim(),
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      return { error: insertError as Error };
    }

    // Then send the email via edge function
    const { error: emailError } = await supabase.functions.invoke(
      "send-clerk-invite",
      {
        body: {
          email: email.toLowerCase().trim(),
          providerName: profile?.company_name || profile?.full_name || "A provider",
          inviteToken: invitation.token,
        },
      }
    );

    if (emailError) {
      // If email fails, we still have the invitation - just log the error
      console.error("Failed to send invitation email:", emailError);
    }

    await fetchInvitations();
    return { error: null, invitation };
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("clerk_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId)
      .eq("provider_id", user.id);

    if (!updateError) {
      await fetchInvitations();
    }

    return { error: updateError as Error | null };
  };

  const resendInvitation = async (invitationId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const invitation = invitations.find((i) => i.id === invitationId);
    if (!invitation) return { error: new Error("Invitation not found") };

    const { error: emailError } = await supabase.functions.invoke(
      "send-clerk-invite",
      {
        body: {
          email: invitation.email,
          providerName: profile?.company_name || profile?.full_name || "A provider",
          inviteToken: invitation.token,
        },
      }
    );

    return { error: emailError as Error | null };
  };

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
  };
};

// Hook for accepting invitations (used by clerks)
export const useAcceptInvitation = () => {
  const { user } = useAuth();

  const getInvitationByToken = async (token: string) => {
    const { data, error } = await supabase
      .rpc("get_invitation_by_token", { _token: token });

    if (error) {
      return { invitation: null, error };
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { invitation: null, error: new Error("Invalid or expired invitation") };
    }

    const invitation = Array.isArray(data) ? data[0] : data;
    return { invitation: invitation as ClerkInvitation, error: null };
  };

  const acceptInvitation = async (token: string, clerkName?: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    // Get the invitation
    const { invitation, error: fetchError } = await getInvitationByToken(token);
    if (fetchError || !invitation) {
      return { error: fetchError || new Error("Invalid invitation") };
    }

    // Update invitation status
    const { error: updateInviteError } = await supabase
      .from("clerk_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    if (updateInviteError) {
      return { error: updateInviteError as Error };
    }

    // Link clerk to provider
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ provider_id: invitation.provider_id })
      .eq("user_id", user.id);

    if (profileError) {
      return { error: profileError as Error };
    }

    // Send notification email to provider (non-blocking)
    supabase.functions.invoke("notify-invitation-accepted", {
      body: {
        providerId: invitation.provider_id,
        clerkName: clerkName || user.email,
        clerkEmail: invitation.email,
      },
    }).then(({ error }) => {
      if (error) {
        console.error("Failed to send acceptance notification:", error);
      }
    });

    return { error: null, providerId: invitation.provider_id };
  };

  return {
    getInvitationByToken,
    acceptInvitation,
  };
};
