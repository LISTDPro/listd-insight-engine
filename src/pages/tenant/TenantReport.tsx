import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTenantPortal } from "@/hooks/useTenantPortal";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface RoomItem {
  id: string;
  item_name: string;
  condition: string | null;
  notes: string | null;
  photos: { id: string; photo_url: string }[];
}

interface Room {
  id: string;
  room_name: string;
  room_order: number;
  items: RoomItem[];
}

const conditionStyles: Record<string, string> = {
  good: "bg-success/10 text-success",
  fair: "bg-warning/10 text-warning",
  poor: "bg-destructive/10 text-destructive",
  na: "bg-muted text-muted-foreground",
};

const TenantReport = () => {
  const { reportId } = useParams();
  const { token, job, property, reports, refresh } = useTenantPortal();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);

  const report = reports.find((r) => r.id === reportId);
  const isSigned = !!report?.signed_at;

  useEffect(() => {
    if (!token || !job) return;
    const fetchDetail = async () => {
      const { data } = await supabase.rpc("tenant_report_detail", {
        _token: token,
        _job_id: job.id,
      });
      if (data) {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setRooms(parsed || []);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [token, job]);

  const handleSign = async () => {
    if (!signatureName.trim() || !token || !reportId) return;
    setSigning(true);
    const { data } = await supabase.rpc("tenant_sign_report", {
      _token: token,
      _report_id: reportId,
      _signature: signatureName.trim(),
    });
    if (data) {
      toast.success("Report signed successfully");
      await refresh();
    } else {
      toast.error("Failed to sign report");
    }
    setSigning(false);
  };

  const handleDownload = () => {
    if (report?.report_url) {
      window.open(report.report_url, "_blank");
    } else {
      toast.error("PDF not available for download");
    }
  };

  // Collect items needing attention
  const attentionItems = rooms.flatMap((room) =>
    room.items
      .filter((i) => i.condition === "fair" || i.condition === "poor")
      .map((i) => ({ ...i, roomName: room.room_name }))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const address = [property?.address_line_1, property?.city, property?.postcode].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      {/* Report header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Condition Report</h1>
          <p className="text-sm text-muted-foreground">{address}</p>
          {report && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Generated {format(new Date(report.generated_at), "d MMMM yyyy")}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={handleDownload}>
          <Download className="w-3.5 h-3.5 mr-1" />
          PDF
        </Button>
      </div>

      {/* Rooms */}
      {rooms.map((room) => (
        <Card key={room.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{room.room_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {room.items.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No items recorded</p>
            ) : (
              room.items.map((item) => (
                <div key={item.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{item.item_name}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${conditionStyles[item.condition || "na"]}`}
                    >
                      {item.condition || "N/A"}
                    </Badge>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mb-2">{item.notes}</p>
                  )}
                  {item.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {item.photos.map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.photo_url}
                          alt={item.item_name}
                          className="w-full h-20 object-cover rounded border border-border"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}

      {/* Items requiring attention */}
      {attentionItems.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Items Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {attentionItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-foreground">
                    {item.roomName} — {item.item_name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] capitalize ${conditionStyles[item.condition || "na"]}`}
                  >
                    {item.condition}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tenant Signature</CardTitle>
        </CardHeader>
        <CardContent>
          {isSigned ? (
            <div className="bg-success/5 rounded-lg p-4 text-center">
              <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Signed by {report?.tenant_signature}</p>
              <p className="text-xs text-muted-foreground">
                {report?.signed_at && format(new Date(report.signed_at), "d MMMM yyyy, HH:mm")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                By typing your full name below, you confirm you have reviewed this report and agree with its contents.
              </p>
              <div>
                <Label htmlFor="sig" className="text-xs">Full Name</Label>
                <Input
                  id="sig"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Type your full name to sign"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input value={format(new Date(), "d MMMM yyyy")} disabled className="mt-1 bg-muted/50" />
              </div>
              <Button
                onClick={handleSign}
                disabled={!signatureName.trim() || signing}
                className="w-full"
              >
                {signing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm & Sign Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantReport;
