
import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Component version for debugging
const COMPONENT_VERSION = "1.0.1";
console.log(`LOV_DEBUG_DATEPICKER: Component loaded, version ${COMPONENT_VERSION}`);

interface DatePickerProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
}

export function DatePicker({ currentDate, onSelect }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-[200px] justify-start text-right font-normal",
            !currentDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {currentDate ? format(currentDate, "dd/MM/yyyy") : <span>בחר תאריך</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={(date) => {
            if (date) {
              console.log(`LOV_DEBUG_DATEPICKER: Date selected: ${date.toISOString()}`);
              onSelect(date);
            }
          }}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
