import { Outlet, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { TenantPortalProvider, useTenantPortal } from "@/hooks/useTenantPortal";
import { Loader2, FileText, FolderOpen } from "lucide-react";
import listdLogo from "@/assets/listd-logo-dark.png";

const TenantLayoutInner = () => {
  const { tenant, property, loading, invalid, token } = useTenantPortal();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (invalid || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <img src={listdLogo} alt="LISTD" className="h-8 mx-auto mb-6" />
          <h1 className="text-lg font-bold text-foreground mb-2">Invalid or Expired Link</h1>
          <p className="text-sm text-muted-foreground">
            This link is no longer valid. Please contact your letting agent or property manager for a new link.
          </p>
        </div>
      </div>
    );
  }

  const address = [property?.address_line_1, property?.city, property?.postcode].filter(Boolean).join(", ");
  const tokenParam = `?token=${token}`;
  const isReports = !location.pathname.includes("/documents");
  const isDocuments = location.pathname.includes("/documents");

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <img src={listdLogo} alt="LISTD" className="h-6" />
          <div className="text-right">
            <p className="text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-none">{address}</p>
            <p className="text-[10px] text-muted-foreground">Tenant: {tenant.full_name || "—"}</p>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto flex">
          <button
            onClick={() => navigate(`/tenant/portal${tokenParam}`)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              isReports
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            My Reports
          </button>
          <button
            onClick={() => navigate(`/tenant/portal/documents${tokenParam}`)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              isDocuments
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Documents
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-4">
        <div className="max-w-3xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[10px] text-muted-foreground border-t border-border">
        Powered by LISTD · Property Inspection Platform
      </footer>
    </div>
  );
};

const TenantLayout = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <TenantPortalProvider token={token}>
      <TenantLayoutInner />
    </TenantPortalProvider>
  );
};

export default TenantLayout;
