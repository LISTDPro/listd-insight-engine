import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAcceptInvitation, ClerkInvitation } from "@/hooks/useClerkInvitations";

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const { user, profile, loading: authLoading, role } = useAuth();
  const { getInvitationByToken, acceptInvitation } = useAcceptInvitation();
  
  const [invitation, setInvitation] = useState<ClerkInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const autoAcceptFired = useRef(false);

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link. No token provided.");
        setLoading(false);
        return;
      }

      const { invitation: inv, error: fetchError } = await getInvitationByToken(token);
      
      if (fetchError || !inv) {
        setError(
          fetchError?.message === "Invitation has expired"
            ? "This invitation has expired. Please contact LISTD to request a new invitation."
            : "Invalid or expired invitation link."
        );
        setLoading(false);
        return;
      }

      setInvitation(inv);
      setLoading(false);
    };

    fetchInvitation();
  }, [token]);

  // Auto-accept: when a logged-in clerk lands here with a valid pending invite token
  // (e.g. after signup → onboarding → redirect back here)
  useEffect(() => {
    if (!user || !token || !invitation || role !== "clerk" || success || autoAcceptFired.current) return;
    autoAcceptFired.current = true;
    const run = async () => {
      const clerkName = profile?.full_name || user.email;
      await acceptInvitation(token, clerkName);
      navigate("/dashboard");
    };
    run();
  }, [user, token, invitation, role, success]);

  const handleAccept = async () => {
    if (!token || !user) return;

    setAccepting(true);
    const clerkName = profile?.full_name || user.email;
    const { error: acceptError } = await acceptInvitation(token, clerkName);
    setAccepting(false);

    if (acceptError) {
      setError(acceptError.message || "Failed to accept invitation.");
      return;
    }

    setSuccess(true);
    
    // Redirect to dashboard after a brief delay
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <CardTitle>Welcome to LISTD!</CardTitle>
            <CardDescription>
              You've successfully joined as an Inventory Clerk.
              Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // User is not logged in - prompt to sign up or log in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <UserPlus className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>You're Invited!</CardTitle>
            <CardDescription>
              You've been invited to join LISTD as an Inventory Clerk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Create an account or log in to accept this invitation.
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild size="lg">
                <Link to={`/auth?redirect=/accept-invite?token=${token}`}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={`/auth?mode=login&redirect=/accept-invite?token=${token}`}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is a clerk with a valid invitation token, show spinner while useEffect auto-accepts
  if (role === "clerk" && invitation && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Finalising your invitation...</p>
        </div>
      </div>
    );
  }

  // Check if user is already a clerk with no pending invite
  if (role === "clerk" && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <CardTitle>Already a Clerk</CardTitle>
            <CardDescription>
              You're already registered as an Inventory Clerk on LISTD.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is logged in but not a clerk - show accept button
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <UserPlus className="w-12 h-12 text-primary mx-auto mb-4" />
          <CardTitle>Join LISTD as an Inventory Clerk</CardTitle>
          <CardDescription>
            Accept this invitation to join as an Inventory Clerk. You'll be able to conduct inspections and submit reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={handleAccept} disabled={accepting}>
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
