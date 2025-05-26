
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

interface ExpenseFiltersProps {
  onFiltersChange?: (filters: {
    date?: Date;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    payee?: string;
  }) => void;
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({ onFiltersChange }) => {
  const [date, setDate] = React.useState<Date>();
  const [category, setCategory] = React.useState<string>('');
  const [minAmount, setMinAmount] = React.useState<string>('');
  const [maxAmount, setMaxAmount] = React.useState<string>('');
  const [payee, setPayee] = React.useState<string>('');

  const handleFilterChange = React.useCallback(() => {
    if (onFiltersChange) {
      onFiltersChange({
        date,
        category,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        payee
      });
    }
  }, [date, category, minAmount, maxAmount, payee, onFiltersChange]);

  const handleClearFilters = () => {
    setDate(undefined);
    setCategory('');
    setMinAmount('');
    setMaxAmount('');
    setPayee('');
    
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const handleApplyFilters = () => {
    handleFilterChange();
  };
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">תאריך</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-right font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy") : <span>בחר תאריך</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
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
              <SelectItem value="">כל הקטגוריות</SelectItem>
              <SelectItem value="rent">שכירות</SelectItem>
              <SelectItem value="supplies">ציוד משרדי</SelectItem>
              <SelectItem value="services">שירותים מקצועיים</SelectItem>
              <SelectItem value="taxes">מסים</SelectItem>
              <SelectItem value="utilities">חשבונות</SelectItem>
              <SelectItem value="other">אחר</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">טווח סכום</label>
          <div className="flex gap-2 items-center">
            <Input 
              type="number" 
              placeholder="מינימום" 
              className="w-full" 
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
            <span className="text-muted-foreground">-</span>
            <Input 
              type="number" 
              placeholder="מקסימום" 
              className="w-full" 
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">למי שולם</label>
          <Input 
            placeholder="חיפוש ספק..." 
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
          />
        </div>
        
        <div className="col-span-full flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={handleClearFilters}>נקה הכל</Button>
          <Button onClick={handleApplyFilters}>החל סינון</Button>
        </div>
      </CardContent>
    </Card>
  );
};
