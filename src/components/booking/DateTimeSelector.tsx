import { useState } from "react";
import { format, isBefore, startOfToday, isToday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Check } from "lucide-react";

interface DateTimeSelectorProps {
  selectedDate: Date | null;
  selectedTimeSlot: string | null;
  onDateChange: (date: Date | null) => void;
  onTimeSlotChange: (slot: string | null) => void;
}

const TIME_SLOTS = [
  { value: "morning", label: "Morning", time: "9:00 – 12:00" },
  { value: "afternoon", label: "Afternoon", time: "12:00 – 17:00" },
  { value: "evening", label: "Evening", time: "17:00 – 20:00" },
];

const DateTimeSelector = ({
  selectedDate,
  selectedTimeSlot,
  onDateChange,
  onTimeSlotChange,
}: DateTimeSelectorProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const today = startOfToday();

  const handleDateSelect = (date: Date | undefined) => {
    onDateChange(date || null);
    setCalendarOpen(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Schedule Inspection</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Pick a date and preferred time window.</p>
      </div>

      {/* Date Picker */}
      <div className="space-y-1.5">
        <Label className="text-xs">Preferred Date *</Label>
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
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              disabled={(date) => isBefore(date, today)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <p className="text-[10px] text-muted-foreground">
          Same-day bookings incur a £30 short-notice surcharge
        </p>
      </div>

      {/* Time Slots */}
      <div className="space-y-1.5">
        <Label className="text-xs">Preferred Time Slot</Label>
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedTimeSlot === slot.value;
            return (
              <button
                key={slot.value}
                type="button"
                onClick={() => onTimeSlotChange(isSelected ? null : slot.value)}
                className={cn(
                  "relative p-2.5 rounded-lg border text-left transition-all",
                  isSelected
                    ? "border-accent ring-1 ring-accent/20 bg-accent/5"
                    : "border-border hover:border-accent/30 bg-card"
                )}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">{slot.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{slot.time}</span>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-accent-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Optional — the assigned clerk will confirm the exact time
        </p>
      </div>
    </div>
  );
};

export default DateTimeSelector;
