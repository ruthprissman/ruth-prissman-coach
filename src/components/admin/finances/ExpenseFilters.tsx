import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFinanceCategories } from '@/hooks/useFinanceCategories';

interface ExpenseFiltersProps {
  onFiltersChange?: (filters: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    payee?: string;
  }) => void;
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({ onFiltersChange }) => {
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [startDateInput, setStartDateInput] = React.useState<string>('');
  const [endDateInput, setEndDateInput] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('');
  const [minAmount, setMinAmount] = React.useState<string>('');
  const [maxAmount, setMaxAmount] = React.useState<string>('');
  const [payee, setPayee] = React.useState<string>('');
  const [dateError, setDateError] = React.useState<string>('');

  // Fetch expense categories from database
  const { data: categories = [] } = useFinanceCategories('expense');

  const validateDateRange = (start?: Date, end?: Date) => {
    if (start && end && start > end) {
      setDateError('תאריך התחלה חייב להיות מוקדם מתאריך הסיום');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleStartDateChange = (date?: Date) => {
    setStartDate(date);
    if (date) {
      setStartDateInput(format(date, 'yyyy-MM-dd'));
    }
    validateDateRange(date, endDate);
  };

  const handleEndDateChange = (date?: Date) => {
    setEndDate(date);
    if (date) {
      setEndDateInput(format(date, 'yyyy-MM-dd'));
    }
    validateDateRange(startDate, date);
  };

  const handleStartDateInputChange = (value: string) => {
    setStartDateInput(value);
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setStartDate(date);
        validateDateRange(date, endDate);
      }
    } else {
      setStartDate(undefined);
    }
  };

  const handleEndDateInputChange = (value: string) => {
    setEndDateInput(value);
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setEndDate(date);
        validateDateRange(startDate, date);
      }
    } else {
      setEndDate(undefined);
    }
  };

  const handleFilterChange = React.useCallback(() => {
    if (!validateDateRange(startDate, endDate)) {
      return;
    }
    
    if (onFiltersChange) {
      onFiltersChange({
        startDate,
        endDate,
        category,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        payee
      });
    }
  }, [startDate, endDate, category, minAmount, maxAmount, payee, onFiltersChange]);

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStartDateInput('');
    setEndDateInput('');
    setCategory('');
    setMinAmount('');
    setMaxAmount('');
    setPayee('');
    setDateError('');
    
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const handleApplyFilters = () => {
    handleFilterChange();
  };
  
  return (
    <Card className="mb-4">
      <CardContent className="p-3 space-y-3">
        {dateError && (
          <div className="text-red-500 text-sm text-center">{dateError}</div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">מתאריך</label>
            <div className="space-y-1">
              <Input
                type="date"
                value={startDateInput}
                onChange={(e) => handleStartDateInputChange(e.target.value)}
                className="h-8 text-xs"
                placeholder="yyyy-mm-dd"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-right font-normal h-8 text-xs",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-1 h-3 w-3" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : <span>בחר בקלנדר</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">עד תאריך</label>
            <div className="space-y-1">
              <Input
                type="date"
                value={endDateInput}
                onChange={(e) => handleEndDateInputChange(e.target.value)}
                className="h-8 text-xs"
                placeholder="yyyy-mm-dd"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-right font-normal h-8 text-xs",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-1 h-3 w-3" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : <span>בחר בקלנדר</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">קטגוריה</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="כל הקטגוריות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">טווח סכום</label>
            <div className="flex gap-1 items-center">
              <Input 
                type="number" 
                placeholder="מינימום" 
                className="w-full h-8 text-xs" 
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
              <span className="text-muted-foreground text-xs">-</span>
              <Input 
                type="number" 
                placeholder="מקסימום" 
                className="w-full h-8 text-xs" 
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">למי שולם</label>
            <Input 
              placeholder="חיפוש ספק..." 
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClearFilters} size="sm" className="h-7 text-xs">
            נקה הכל
          </Button>
          <Button onClick={handleApplyFilters} size="sm" className="h-7 text-xs">
            החל סינון
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
