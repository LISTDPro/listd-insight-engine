import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { CalendarIcon, Clock, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TIME_SLOTS = [
  { value: "morning", label: "Morning", time: "9:00 – 12:00" },
  { value: "afternoon", label: "Afternoon", time: "12:00 – 17:00" },
  { value: "evening", label: "Evening", time: "17:00 – 20:00" },
];

interface RescheduleRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  currentDate: string;
  currentTimeSlot: string | null;
  onSuccess: () => void;
}

const RescheduleRequestDialog = ({
  open,
  onOpenChange,
  jobId,
  currentDate,
  currentTimeSlot,
  onSuccess,
}: RescheduleRequestDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = startOfToday();
  const minDate = addDays(today, 1);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select a new preferred date");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("jobs")
      .update({
        reschedule_requested_date: format(selectedDate, "yyyy-MM-dd"),
        reschedule_requested_time_slot: selectedTimeSlot,
        reschedule_requested_at: new Date().toISOString(),
        reschedule_status: "pending",
      } as any)
      .eq("id", jobId);

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit reschedule request");
    } else {
      toast.success("Reschedule request submitted. An admin will review it shortly.");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Reschedule</DialogTitle>
          <DialogDescription>
            Propose a new date and time for this inspection. An admin will review and approve or reject your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current date info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">Current scheduled date</p>
            <p className="text-sm font-medium text-foreground">
              {format(new Date(currentDate), "EEEE, d MMMM yyyy")}
              {currentTimeSlot && ` · ${currentTimeSlot}`}
            </p>
          </div>

          {/* New date picker */}
          <div className="space-y-1.5">
            <Label className="text-xs">New Preferred Date *</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a new date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => {
                    setSelectedDate(date || null);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => isBefore(date, minDate)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time slot selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Preferred Time Slot (Optional)</Label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTimeSlot === slot.value;
                return (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setSelectedTimeSlot(isSelected ? null : slot.value)}
                    className={cn(
                      "relative p-2 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-accent ring-1 ring-accent/20 bg-accent/5"
                        : "border-border hover:border-accent/30 bg-card"
                    )}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium text-[11px] text-foreground">{slot.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{slot.time}</span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center">
                        <Check className="w-2 h-2 text-accent-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || !selectedDate}>
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleRequestDialog;
