
import React from 'react';
import { Search, Filter, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Patient } from '@/types/patient';
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
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  patientFilter: string;
  setPatientFilter: (value: string) => void;
  meetingTypeFilter: string;
  setMeetingTypeFilter: (value: string) => void;
  dateRangeFilter: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setDateRangeFilter: (value: { from: Date | undefined; to: Date | undefined }) => void;
  patients: Patient[];
  resetFilters: () => void;
}

const SessionFilters: React.FC<SessionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  patientFilter,
  setPatientFilter,
  meetingTypeFilter,
  setMeetingTypeFilter,
  dateRangeFilter,
  setDateRangeFilter,
  patients,
  resetFilters,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
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
        <h3 className="text-lg font-medium">סינון וחיפוש</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search by patient name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">חיפוש לפי שם מטופל</label>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="הקלד שם מטופל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Filter by patient */}
        <div className="space-y-2">
          <label className="text-sm font-medium">סינון לפי מטופל</label>
          <Select
            value={patientFilter}
            onValueChange={setPatientFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="כל המטופלים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">כל המטופלים</SelectItem>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id.toString()}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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
              <SelectItem value="">כל סוגי הפגישות</SelectItem>
              <SelectItem value="Zoom">זום</SelectItem>
              <SelectItem value="Phone">טלפון</SelectItem>
              <SelectItem value="In-Person">פגישה פרונטלית</SelectItem>
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

export default SessionFilters;
