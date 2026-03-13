import { useState } from "react";
import { useAllOrganisations } from "@/hooks/useSuperAdminData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";

const SuperAdminOrganisations = () => {
  const { data: orgs, isLoading } = useAllOrganisations();
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  const filtered = (orgs || []).filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Organisations</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or owner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organisation</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Jobs</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No organisations found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((org) => (
                <TableRow
                  key={org.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedOrg(org)}
                >
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.ownerName}</TableCell>
                  <TableCell>{org.memberCount}</TableCell>
                  <TableCell>{org.jobCount}</TableCell>
                  <TableCell>{org.propertyCount}</TableCell>
                  <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedOrg?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner</span>
              <span>{selectedOrg?.ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Members</span>
              <span>{selectedOrg?.memberCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jobs</span>
              <span>{selectedOrg?.jobCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Properties</span>
              <span>{selectedOrg?.propertyCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{selectedOrg && new Date(selectedOrg.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminOrganisations;
