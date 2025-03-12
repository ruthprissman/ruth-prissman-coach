
import React from 'react';
import { Search, Filter, CalendarRange, BadgeDollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';

interface SessionFiltersProps {
  meetingTypeFilter: string;
  setMeetingTypeFilter: (value: string) => void;
  paymentStatusFilter: string;
  setPaymentStatusFilter: (value: string) => void;
  dateRangeFilter: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setDateRangeFilter: (value: { from: Date | undefined; to: Date | undefined }) => void;
  resetFilters: () => void;
}

const PatientSessionFilters: React.FC<SessionFiltersProps> = ({
  meetingTypeFilter,
  setMeetingTypeFilter,
  paymentStatusFilter,
  setPaymentStatusFilter,
  dateRangeFilter,
  setDateRangeFilter,
  resetFilters,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={resetFilters}
          className="flex gap-2"
        >
          <Filter className="h-4 w-4" />
          איפוס מסננים
        </Button>
        <h3 className="text-lg font-medium">סינון פגישות</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Filter by meeting type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">סינון לפי סוג פגישה</label>
          <Select
            value={meetingTypeFilter}
            onValueChange={setMeetingTypeFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="כל סוגי הפגישות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל סוגי הפגישות</SelectItem>
              <SelectItem value="Zoom">זום</SelectItem>
              <SelectItem value="Phone">טלפון</SelectItem>
              <SelectItem value="In-Person">פגישה פרונטלית</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Filter by payment status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">סינון לפי סטטוס תשלום</label>
          <Select
            value={paymentStatusFilter}
            onValueChange={setPaymentStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="כל סטטוסי התשלום" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל סטטוסי התשלום</SelectItem>
              <SelectItem value="paid">שולם</SelectItem>
              <SelectItem value="partially_paid">שולם חלקית</SelectItem>
              <SelectItem value="unpaid">לא שולם</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Filter by date range */}
        <div className="space-y-2">
          <label className="text-sm font-medium">סינון לפי טווח תאריכים</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-right font-normal"
              >
                <CalendarRange className="ml-2 h-4 w-4" />
                {dateRangeFilter.from ? (
                  dateRangeFilter.to ? (
                    <>
                      {format(dateRangeFilter.from, "dd/MM/yyyy")} -{" "}
                      {format(dateRangeFilter.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRangeFilter.from, "dd/MM/yyyy")
                  )
                ) : (
                  "בחר טווח תאריכים"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRangeFilter.from}
                selected={{
                  from: dateRangeFilter.from,
                  to: dateRangeFilter.to,
                }}
                onSelect={(range) => setDateRangeFilter({
                  from: range?.from,
                  to: range?.to,
                })}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default PatientSessionFilters;
