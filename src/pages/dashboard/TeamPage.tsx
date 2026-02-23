import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Mail,
  Plus,
  Building2,
  Loader2,
  UserCheck,
  UserX,
  Crown,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";

interface OrgMember {
  id: string;
  user_id: string;
  org_role: string;
  status: string;
  invited_email: string | null;
  invited_at: string | null;
  last_active_at: string | null;
  created_at: string;
  profile_name?: string;
  profile_email?: string;
}

const TeamPage = () => {
  const { user, role, orgRole, organisationId, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState<string | null>(organisationId);
  const [currentOrgName, setCurrentOrgName] = useState("");
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setOrgId(organisationId);
  }, [organisationId]);

  useEffect(() => {
    if (orgId) {
      fetchOrgData();
    } else {
      setLoading(false);
    }
  }, [orgId]);

  const fetchOrgData = async () => {
    if (!orgId) return;
    setLoading(true);

    // Fetch org name
    const { data: org } = await supabase
      .from("organisations" as any)
      .select("name")
      .eq("id", orgId)
      .single();
    if (org) setCurrentOrgName((org as any).name);

    // Fetch members
    const { data: memberData } = await supabase
      .from("organisation_members" as any)
      .select("*")
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: true });

    if (memberData) {
      // Fetch profile names for active members
      const activeUserIds = (memberData as any[])
        .filter((m) => m.user_id && m.status !== "invited")
        .map((m) => m.user_id);

      let profileMap: Record<string, { full_name: string | null }> = {};
      if (activeUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", activeUserIds);
        if (profiles) {
          profileMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = { full_name: p.full_name };
            return acc;
          }, {} as Record<string, { full_name: string | null }>);
        }
      }

      setMembers(
        (memberData as any[]).map((m) => ({
          ...m,
          profile_name: profileMap[m.user_id]?.full_name || null,
          profile_email: m.invited_email || null,
        }))
      );
    }

    setLoading(false);
  };

  const handleCreateOrg = async () => {
    if (!user || !orgName.trim()) return;
    setCreating(true);

    // Create organisation
    const { data: newOrg, error: orgError } = await (supabase as any)
      .from("organisations")
      .insert({ name: orgName.trim(), created_by: user.id })
      .select()
      .single();

    if (orgError) {
      toast({ title: "Error", description: orgError.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    // Insert self as owner
    const { error: memberError } = await (supabase as any)
      .from("organisation_members")
      .insert({
        organisation_id: newOrg.id,
        user_id: user.id,
        org_role: "owner",
        status: "active",
      });

    if (memberError) {
      toast({ title: "Error", description: memberError.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    // Backfill existing jobs and properties
    await (supabase as any).rpc("backfill_org_data", {
      _user_id: user.id,
      _org_id: newOrg.id,
    });

    setOrgId(newOrg.id);
    await refreshProfile();
    toast({ title: "Organisation Created", description: `"${orgName.trim()}" is now set up.` });
    setCreating(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !orgId) return;
    setInviting(true);

    // Check if already invited
    const existing = members.find(
      (m) => m.invited_email?.toLowerCase() === inviteEmail.trim().toLowerCase()
    );
    if (existing) {
      toast({ title: "Already invited", description: "This email has already been added.", variant: "destructive" });
      setInviting(false);
      return;
    }

    // Insert as invited member (user_id will be a placeholder until they sign up)
    // We use a placeholder UUID that will be replaced when the user accepts
    const { data: newMember, error } = await (supabase as any)
      .from("organisation_members")
      .insert({
        organisation_id: orgId,
        user_id: "00000000-0000-0000-0000-000000000000", // placeholder
        org_role: "staff",
        status: "invited",
        invited_email: inviteEmail.trim().toLowerCase(),
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setInviting(false);
      return;
    }

    // Send invite email via edge function
    try {
      await supabase.functions.invoke("send-team-invite", {
        body: {
          email: inviteEmail.trim().toLowerCase(),
          organisationName: currentOrgName,
          inviteToken: newMember.invite_token,
          inviterName: user?.user_metadata?.full_name || "Your team",
        },
      });
    } catch (e) {
      console.error("Failed to send invite email:", e);
    }

    toast({ title: "Invitation Sent", description: `Invite sent to ${inviteEmail.trim()}` });
    setInviteEmail("");
    setInviteOpen(false);
    setInviting(false);
    fetchOrgData();
  };

  const toggleMemberStatus = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    const { error } = await (supabase as any)
      .from("organisation_members")
      .update({ status: newStatus })
      .eq("id", memberId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === "disabled" ? "User Disabled" : "User Re-enabled" });
      fetchOrgData();
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim() || !orgId) return;
    setSavingName(true);
    const { error } = await (supabase as any)
      .from("organisations")
      .update({ name: editName.trim() })
      .eq("id", orgId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCurrentOrgName(editName.trim());
      toast({ title: "Organisation name updated" });
      setEditNameOpen(false);
    }
    setSavingName(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success">Active</Badge>;
      case "invited":
        return <Badge className="bg-warning/10 text-warning">Invited</Badge>;
      case "disabled":
        return <Badge className="bg-destructive/10 text-destructive">Disabled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Staff users can't access this page
  if (role !== "client" && role !== "admin") {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">You don't have access to this page.</p>
      </div>
    );
  }

  if (orgRole === "staff") {
    return (
      <div className="p-6 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Team</h2>
        <p className="text-muted-foreground">Only the organisation owner can manage team settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No org yet — show setup card
  if (!orgId) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Create Your Organisation</CardTitle>
            </div>
            <CardDescription>
              Set up your organisation to invite team members who can create and manage bookings on your behalf.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organisation Name</Label>
              <Input
                id="orgName"
                placeholder="e.g. ABC Lettings"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreateOrg}
              disabled={creating || !orgName.trim()}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organisation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground tracking-tight">{currentOrgName}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditName(currentOrgName);
              setEditNameOpen(true);
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Manage your team members and access</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Team Members</CardTitle>
            </div>
            <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {member.org_role === "owner" && <Crown className="w-3.5 h-3.5 text-warning" />}
                      {member.profile_name || member.invited_email || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {member.org_role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.invited_email || "—"}
                  </TableCell>
                  <TableCell>{statusBadge(member.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.last_active_at
                      ? format(new Date(member.last_active_at), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.org_role !== "owner" && member.status !== "invited" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMemberStatus(member.id, member.status)}
                        className="gap-1 text-xs"
                      >
                        {member.status === "active" ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Disable
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Enable
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an email invitation to join your organisation as a Staff User.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Organisation Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="editOrgName">Organisation Name</Label>
            <Input
              id="editOrgName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNameOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveName} disabled={savingName || !editName.trim()}>
              {savingName && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPage;
