
import React from 'react';
import { Filter, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
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
import { Card, CardContent } from '@/components/ui/card';

interface PatientsListFiltersProps {
  statusFilter: 'all' | 'active' | 'inactive';
  setStatusFilter: (value: 'all' | 'active' | 'inactive') => void;
  debtFilter: 'all' | 'has_debt' | 'no_debt';
  setDebtFilter: (value: 'all' | 'has_debt' | 'no_debt') => void;
  dateRangeFilter: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setDateRangeFilter: (value: { from: Date | undefined; to: Date | undefined }) => void;
  resetFilters: () => void;
}

const PatientsListFilters: React.FC<PatientsListFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  debtFilter,
  setDebtFilter,
  dateRangeFilter,
  setDateRangeFilter,
  resetFilters,
}) => {
  return (
    <Card className="bg-white shadow rounded-lg">
      <CardContent className="p-6">
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
          <h3 className="text-lg font-medium text-[#4A235A]">סינון מטופלים</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filter by active status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">סינון לפי סטטוס</label>
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="כל המטופלים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המטופלים</SelectItem>
                <SelectItem value="active">מטופלים פעילים</SelectItem>
                <SelectItem value="inactive">מטופלים לא פעילים</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Filter by debt status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">סינון לפי חובות</label>
            <Select
              value={debtFilter}
              onValueChange={(value: 'all' | 'has_debt' | 'no_debt') => setDebtFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="כל המטופלים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המטופלים</SelectItem>
                <SelectItem value="has_debt">מטופלים עם חובות</SelectItem>
                <SelectItem value="no_debt">מטופלים ללא חובות</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Filter by date range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">סינון לפי תאריך פגישה אחרונה</label>
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
      </CardContent>
    </Card>
  );
};

export default PatientsListFilters;
