import { useState } from "react";
import { useAllClerks } from "@/hooks/useSuperAdminData";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Search, Star } from "lucide-react";

const SuperAdminClerks = () => {
  const { data: clerks, isLoading } = useAllClerks();
  const [search, setSearch] = useState("");

  const filtered = (clerks || []).filter((c) =>
    (c.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Clerks</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Jobs Completed</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No clerks found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((clerk) => (
                <TableRow key={clerk.user_id}>
                  <TableCell className="font-medium">{clerk.full_name || "—"}</TableCell>
                  <TableCell>Level {clerk.level}</TableCell>
                  <TableCell>{clerk.jobsCompleted}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {clerk.rating.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(clerk.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SuperAdminClerks;
