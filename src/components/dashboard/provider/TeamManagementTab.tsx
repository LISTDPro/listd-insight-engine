import { useState } from "react";
import { Mail, UserCheck, Clock, XCircle, RefreshCw, Send, Users, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useClerkInvitations, ClerkInvitation } from "@/hooks/useClerkInvitations";
import { useClerks, Clerk } from "@/hooks/useClerks";
import { formatDistanceToNow, format, isPast } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TeamManagementTab = () => {
  const { toast } = useToast();
  const { invitations, loading, cancelInvitation, resendInvitation } = useClerkInvitations();
  const { clerks, loading: clerksLoading, removeClerk } = useClerks();
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [clerkToRemove, setClerkToRemove] = useState<Clerk | null>(null);

  const pendingInvitations = invitations.filter(inv => inv.status === "pending");
  const acceptedInvitations = invitations.filter(inv => inv.status === "accepted");
  const expiredOrCancelled = invitations.filter(inv => inv.status === "expired" || inv.status === "cancelled");

  const handleCancel = async (invitationId: string) => {
    setActionLoading(invitationId);
    const { error } = await cancelInvitation(invitationId);
    setActionLoading(null);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled.",
      });
    }
  };

  const handleResend = async (invitationId: string) => {
    setActionLoading(invitationId);
    const { error } = await resendInvitation(invitationId);
    setActionLoading(null);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Invitation Resent",
        description: "The invitation email has been sent again.",
      });
    }
  };

  const handleRemoveClerk = async () => {
    if (!clerkToRemove) return;
    
    setActionLoading(clerkToRemove.user_id);
    const { error } = await removeClerk(clerkToRemove.user_id);
    setActionLoading(null);
    setClerkToRemove(null);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove clerk from team. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Clerk Removed",
        description: `${clerkToRemove.full_name || "The clerk"} has been removed from your team.`,
      });
    }
  };

  const getStatusBadge = (invitation: ClerkInvitation) => {
    const isExpired = isPast(new Date(invitation.expires_at));
    
    if (invitation.status === "accepted") {
      return <Badge variant="default" className="bg-success text-success-foreground">Accepted</Badge>;
    }
    if (invitation.status === "cancelled") {
      return <Badge variant="secondary">Cancelled</Badge>;
    }
    if (isExpired || invitation.status === "expired") {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge variant="outline" className="border-warning text-warning">Pending</Badge>;
  };

  const InvitationCard = ({ invitation }: { invitation: ClerkInvitation }) => {
    const isExpired = isPast(new Date(invitation.expires_at));
    const canResend = invitation.status === "pending" && !isExpired;
    const canCancel = invitation.status === "pending";

    return (
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-foreground truncate">{invitation.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}</span>
              </div>
              {invitation.status === "pending" && !isExpired && (
                <div className="text-xs text-muted-foreground mt-1">
                  Expires {format(new Date(invitation.expires_at), "MMM d, yyyy")}
                </div>
              )}
              {invitation.status === "accepted" && invitation.accepted_at && (
                <div className="text-xs text-success mt-1">
                  Accepted {formatDistanceToNow(new Date(invitation.accepted_at), { addSuffix: true })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(invitation)}
              {canResend && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResend(invitation.id)}
                  disabled={actionLoading === invitation.id}
                >
                  {actionLoading === invitation.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(invitation.id)}
                  disabled={actionLoading === invitation.id}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ClerkCard = ({ clerk }: { clerk: Clerk }) => (
    <Card className="bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-accent-foreground">
              {clerk.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "CL"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate">
              {clerk.full_name || "Unknown Clerk"}
            </div>
            {clerk.phone && (
              <div className="text-sm text-muted-foreground">{clerk.phone}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-success text-success-foreground">
              <UserCheck className="w-3 h-3 mr-1" />
              Active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClerkToRemove(clerk)}
              disabled={actionLoading === clerk.user_id}
              className="text-destructive hover:text-destructive"
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading || clerksLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading team data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Team Members */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          Active Clerks ({clerks.length})
        </h3>
        {clerks.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No clerks on your team yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Send invitations to build your team
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {clerks.map((clerk) => (
              <ClerkCard key={clerk.user_id} clerk={clerk} />
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pending Invitations ({pendingInvitations.length})
        </h3>
        {pendingInvitations.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending invitations</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {pendingInvitations.map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </div>
        )}
      </div>

      {/* Accepted Invitations (history) */}
      {acceptedInvitations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Accepted Invitations ({acceptedInvitations.length})
          </h3>
          <div className="grid gap-3">
            {acceptedInvitations.map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </div>
        </div>
      )}

      {/* Expired/Cancelled (collapsible history) */}
      {expiredOrCancelled.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Expired/Cancelled ({expiredOrCancelled.length})
          </h3>
          <div className="grid gap-3 opacity-60">
            {expiredOrCancelled.slice(0, 5).map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </div>
        </div>
      )}
      {/* Remove Clerk Confirmation Dialog */}
      <AlertDialog open={!!clerkToRemove} onOpenChange={(open) => !open && setClerkToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Clerk from Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{clerkToRemove?.full_name || "this clerk"}</strong> from your team? 
              They will no longer be able to see or work on jobs assigned to them through your company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveClerk}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Clerk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamManagementTab;
