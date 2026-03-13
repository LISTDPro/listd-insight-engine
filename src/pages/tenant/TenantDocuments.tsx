import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

const TenantDocuments = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Documents</h2>
      <Card>
        <CardContent className="py-10 text-center">
          <FolderOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No documents shared yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Any documents shared by your agent will appear here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantDocuments;
