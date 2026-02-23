import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPlus, X, User, Mail, Phone } from "lucide-react";

export interface TenantData {
  full_name: string;
  email: string;
  phone: string;
}

interface TenantDetailsFormProps {
  primaryTenant: TenantData;
  secondaryTenant: TenantData | null;
  onPrimaryChange: (data: TenantData) => void;
  onSecondaryChange: (data: TenantData | null) => void;
  isCheckIn: boolean;
}

const TenantDetailsForm = ({
  primaryTenant,
  secondaryTenant,
  onPrimaryChange,
  onSecondaryChange,
  isCheckIn,
}: TenantDetailsFormProps) => {
  const [showSecondary, setShowSecondary] = useState(!!secondaryTenant);

  const handleAddSecondary = () => {
    setShowSecondary(true);
    onSecondaryChange({ full_name: "", email: "", phone: "" });
  };

  const handleRemoveSecondary = () => {
    setShowSecondary(false);
    onSecondaryChange(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Tenant Details</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isCheckIn
            ? "Please provide the tenant's details. Full name is required for Check-In inspections."
            : "Optionally provide tenant contact details for this inspection."}
        </p>
      </div>

      {/* Primary Tenant */}
      <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          Primary Tenant
        </h4>

        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="tenant_name" className="text-xs">
              Full Name {isCheckIn && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="tenant_name"
              value={primaryTenant.full_name}
              onChange={(e) => onPrimaryChange({ ...primaryTenant, full_name: e.target.value })}
              placeholder="Tenant's full name"
              className="text-xs h-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="tenant_email" className="text-xs flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <Input
                id="tenant_email"
                type="email"
                value={primaryTenant.email}
                onChange={(e) => onPrimaryChange({ ...primaryTenant, email: e.target.value })}
                placeholder="tenant@email.com"
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tenant_phone" className="text-xs flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </Label>
              <Input
                id="tenant_phone"
                type="tel"
                value={primaryTenant.phone}
                onChange={(e) => onPrimaryChange({ ...primaryTenant, phone: e.target.value })}
                placeholder="07xxx xxxxxx"
                className="text-xs h-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Tenant */}
      {showSecondary && secondaryTenant ? (
        <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Second Tenant
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-destructive hover:text-destructive"
              onClick={handleRemoveSecondary}
            >
              <X className="w-3 h-3 mr-1" />
              Remove
            </Button>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="tenant2_name" className="text-xs">Full Name</Label>
              <Input
                id="tenant2_name"
                value={secondaryTenant.full_name}
                onChange={(e) => onSecondaryChange({ ...secondaryTenant, full_name: e.target.value })}
                placeholder="Second tenant's full name"
                className="text-xs h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="tenant2_email" className="text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <Input
                  id="tenant2_email"
                  type="email"
                  value={secondaryTenant.email}
                  onChange={(e) => onSecondaryChange({ ...secondaryTenant, email: e.target.value })}
                  placeholder="tenant@email.com"
                  className="text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tenant2_phone" className="text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </Label>
                <Input
                  id="tenant2_phone"
                  type="tel"
                  value={secondaryTenant.phone}
                  onChange={(e) => onSecondaryChange({ ...secondaryTenant, phone: e.target.value })}
                  placeholder="07xxx xxxxxx"
                  className="text-xs h-8"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddSecondary}
          className="w-full gap-2 text-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Second Tenant
        </Button>
      )}
    </div>
  );
};

export default TenantDetailsForm;
