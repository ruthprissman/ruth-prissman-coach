
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePatients } from '@/hooks/usePatients';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useFinanceCategories } from '@/hooks/useFinanceCategories';

interface IncomeFiltersProps {
  onFiltersChange?: (filters: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    paymentMethod?: string;
    client?: string;
  }) => void;
}

export const IncomeFilters: React.FC<IncomeFiltersProps> = ({ onFiltersChange }) => {
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [category, setCategory] = React.useState<string>('');
  const [paymentMethod, setPaymentMethod] = React.useState<string>('');
  const [client, setClient] = React.useState<string>('');

  // Fetch data from database
  const { data: patients = [] } = usePatients();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: categories = [] } = useFinanceCategories('income');

  const handleFilterChange = React.useCallback(() => {
    if (onFiltersChange) {
      onFiltersChange({
        startDate,
        endDate,
        category,
        paymentMethod,
        client
      });
    }
  }, [startDate, endDate, category, paymentMethod, client, onFiltersChange]);

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCategory('');
    setPaymentMethod('');
    setClient('');
    
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const handleApplyFilters = () => {
    handleFilterChange();
  };
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">מתאריך</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-right font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : <span>בחר תאריך התחלה</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">עד תאריך</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-right font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : <span>בחר תאריך סיום</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">קטגוריה</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
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
        
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">אמצעי תשלום</label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="כל אמצעי התשלום" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.name}>
                  {method.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">לקוח</label>
          <Select value={client} onValueChange={setClient}>
            <SelectTrigger>
              <SelectValue placeholder="כל הלקוחות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הלקוחות</SelectItem>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.name}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-full flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={handleClearFilters}>נקה הכל</Button>
          <Button onClick={handleApplyFilters}>החל סינון</Button>
        </div>
      </CardContent>
    </Card>
  );
};
