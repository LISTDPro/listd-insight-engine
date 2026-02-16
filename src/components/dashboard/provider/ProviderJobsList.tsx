import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Briefcase, Users, RefreshCw, UserPlus, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useProviderJobs } from "@/hooks/useProviderJobs";
import { useClerks } from "@/hooks/useClerks";
import JobRequestCard from "./JobRequestCard";
import ClerkAssignmentSheet from "./ClerkAssignmentSheet";
import InviteClerkDialog from "./InviteClerkDialog";
import TeamManagementTab from "./TeamManagementTab";
import SwipeableCardStack from "../SwipeableCardStack";
import SwipeJobCardContent from "../SwipeJobCardContent";

const ProviderJobsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { publishedJobs, myJobs, loading, refreshJobs, acceptJob, declineJob, assignClerk } = useProviderJobs();
  const { clerks, loading: clerksLoading } = useClerks();
  
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [assignmentSheetOpen, setAssignmentSheetOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Categorize my jobs
  const pendingAssignment = myJobs.filter(job => job.status === "accepted" && !job.clerk_id);
  const assignedJobs = myJobs.filter(job => job.clerk_id || !["accepted", "cancelled"].includes(job.status));

  const handleAccept = async (jobId: string) => {
    setAcceptingJobId(jobId);
    const { error } = await acceptJob(jobId);
    setAcceptingJobId(null);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept job. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Job Accepted",
        description: "The job has been added to your queue. Assign a clerk to proceed.",
      });
    }
  };

  const handleDecline = async (jobId: string) => {
    await declineJob(jobId);
    toast({
      title: "Job Declined",
      description: "The job has been removed from your view.",
    });
  };

  const handleOpenAssignment = (jobId: string) => {
    setSelectedJobId(jobId);
    setAssignmentSheetOpen(true);
  };

  const handleAssignClerk = async (clerkId: string) => {
    if (!selectedJobId) return;

    const { error } = await assignClerk(selectedJobId, clerkId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to assign clerk. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Clerk Assigned",
        description: "The clerk has been notified of their new assignment.",
      });
    }
  };

  const getClerkName = (clerkId: string | null | undefined) => {
    if (!clerkId) return null;
    const clerk = clerks.find(c => c.user_id === clerkId);
    return clerk?.full_name || "Unknown Clerk";
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Job Management</h2>
        <div className="flex items-center gap-2">
          <InviteClerkDialog>
            <Button variant="outline" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Invite Clerk</span>
            </Button>
          </InviteClerkDialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshJobs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="incoming" className="gap-2">
            <Inbox className="w-4 h-4" />
            <span className="hidden sm:inline">Incoming</span>
            {publishedJobs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-accent text-accent-foreground rounded-full">
                {publishedJobs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Assign</span>
            {pendingAssignment.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                {pendingAssignment.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Active</span>
            {assignedJobs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {assignedJobs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
        </TabsList>

        {/* Incoming Job Requests — Swipeable */}
        <TabsContent value="incoming">
          <SwipeableCardStack
            items={publishedJobs.map((j) => ({ ...j, id: j.id }))}
            rightLabel="Accept"
            leftLabel="Decline"
            rightIcon={<Check className="w-5 h-5" />}
            leftIcon={<X className="w-5 h-5" />}
            onSwipeRight={(job) => handleAccept(job.id)}
            onSwipeLeft={(job) => handleDecline(job.id)}
            renderCard={(job) => (
              <SwipeJobCardContent
                job={job}
                statusBadge={
                  <Badge className="bg-accent text-accent-foreground text-xs">New Request</Badge>
                }
              />
            )}
            emptyMessage={
              loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading incoming jobs...
                </div>
              ) : (
                <div className="text-center py-12">
                  <Inbox className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No incoming job requests</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    New jobs from clients will appear here
                  </p>
                </div>
              )
            }
          />
        </TabsContent>

        {/* Pending Clerk Assignment */}
        <TabsContent value="pending" className="space-y-4">
          {pendingAssignment.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No jobs pending assignment</p>
              <p className="text-sm text-muted-foreground mt-1">
                Accept incoming jobs to assign clerks
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingAssignment.map((job) => (
                <JobRequestCard
                  key={job.id}
                  job={job}
                  onAssignClerk={handleOpenAssignment}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Jobs */}
        <TabsContent value="active" className="space-y-4">
          {assignedJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No active jobs</p>
              <p className="text-sm text-muted-foreground mt-1">
                Assigned jobs and their progress will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignedJobs.map((job) => (
                <JobRequestCard
                  key={job.id}
                  job={job}
                  clerkName={getClerkName(job.clerk_id)}
                  onViewDetails={(id) => navigate(`/dashboard/jobs/${id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team">
          <TeamManagementTab />
        </TabsContent>
      </Tabs>

      {/* Clerk Assignment Sheet */}
      <ClerkAssignmentSheet
        open={assignmentSheetOpen}
        onOpenChange={setAssignmentSheetOpen}
        clerks={clerks}
        onAssign={handleAssignClerk}
        loading={clerksLoading}
      />
    </div>
  );
};

export default ProviderJobsList;
