import { useState } from "react";
import { User, Check, Search, UserPlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clerk } from "@/hooks/useClerks";

interface ClerkAssignmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clerks: Clerk[];
  onAssign: (clerkId: string) => Promise<void>;
  loading?: boolean;
}

const ClerkAssignmentSheet = ({
  open,
  onOpenChange,
  clerks,
  onAssign,
  loading = false,
}: ClerkAssignmentSheetProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClerkId, setSelectedClerkId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const filteredClerks = clerks.filter((clerk) =>
    clerk.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedClerkId) return;
    
    setIsAssigning(true);
    try {
      await onAssign(selectedClerkId);
      onOpenChange(false);
      setSelectedClerkId(null);
      setSearchQuery("");
    } finally {
      setIsAssigning(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle>Assign Clerk</SheetTitle>
          <SheetDescription>
            Select a clerk from your team to assign to this job
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clerks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clerk List */}
        <div className="flex-1 overflow-auto space-y-2 max-h-[calc(80vh-220px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading clerks...
            </div>
          ) : filteredClerks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserPlus className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No clerks found matching your search"
                  : "No clerks in your team yet"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  Invite clerks to join your team to assign them to jobs
                </p>
              )}
            </div>
          ) : (
            filteredClerks.map((clerk) => (
              <button
                key={clerk.id}
                onClick={() => setSelectedClerkId(clerk.user_id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedClerkId === clerk.user_id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={clerk.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(clerk.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">
                    {clerk.full_name || "Unnamed Clerk"}
                  </p>
                  {clerk.phone && (
                    <p className="text-sm text-muted-foreground">{clerk.phone}</p>
                  )}
                </div>
                {selectedClerkId === clerk.user_id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Confirm Button */}
        <div className="pt-4 border-t mt-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleAssign}
            disabled={!selectedClerkId || isAssigning}
          >
            {isAssigning ? (
              "Assigning..."
            ) : (
              <>
                <User className="w-4 h-4 mr-2" />
                Assign Selected Clerk
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClerkAssignmentSheet;
