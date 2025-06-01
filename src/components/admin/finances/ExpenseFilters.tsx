
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('');
  const [minAmount, setMinAmount] = React.useState<string>('');
  const [maxAmount, setMaxAmount] = React.useState<string>('');
  const [payee, setPayee] = React.useState<string>('');
  const [dateError, setDateError] = React.useState<string>('');
  const [dateRange, setDateRange] = React.useState<string>('');

  // Fetch expense categories from database
  const { data: categories = [] } = useFinanceCategories('expense');

  const validateDateRange = (start: string, end: string) => {
    if (start && end) {
      const startDateObj = new Date(start);
      const endDateObj = new Date(end);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        setDateError('תאריך לא תקין');
        return false;
      }
      
      if (startDateObj > endDateObj) {
        setDateError('תאריך התחלה חייב להיות מוקדם מתאריך הסיום');
        return false;
      }
    }
    
    setDateError('');
    return true;
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    
    switch (value) {
      case 'current-year':
        setStartDate(`${currentYear}-01-01`);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'all-time':
        setStartDate('2020-01-01'); // נקודת התחלה של הנתונים
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'last-month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(lastMonth.toISOString().split('T')[0]);
        setEndDate(lastMonthEnd.toISOString().split('T')[0]);
        break;
      case 'current-month':
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(currentMonthStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'custom':
        // לא משנה כלום - המשתמש יכול להזין ידנית
        break;
      case 'none':
        setStartDate('');
        setEndDate('');
        break;
      default:
        setStartDate('');
        setEndDate('');
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setDateRange('custom'); // מעבר למצב מותאם אישית כשמזינים ידנית
    validateDateRange(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setDateRange('custom'); // מעבר למצב מותאם אישית כשמזינים ידנית
    validateDateRange(startDate, value);
  };

  const handleFilterChange = React.useCallback(() => {
    if (!validateDateRange(startDate, endDate)) {
      return;
    }
    
    if (onFiltersChange) {
      onFiltersChange({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        category: category === 'all' ? undefined : category,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        payee: payee || undefined
      });
    }
  }, [startDate, endDate, category, minAmount, maxAmount, payee, onFiltersChange]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategory('');
    setMinAmount('');
    setMaxAmount('');
    setPayee('');
    setDateError('');
    setDateRange('');
    
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const handleApplyFilters = () => {
    handleFilterChange();
  };
  
  return (
    <Card className="mb-4">
      <CardContent className="p-3 space-y-2">
        {dateError && (
          <div className="text-red-500 text-sm text-center">{dateError}</div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">טווח תאריכים</label>
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="בחר טווח" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא סינון תאריכים</SelectItem>
                <SelectItem value="current-month">החודש הנוכחי</SelectItem>
                <SelectItem value="last-month">החודש הקודם</SelectItem>
                <SelectItem value="current-year">מתחילת השנה הנוכחית</SelectItem>
                <SelectItem value="all-time">מתחילת הנתונים</SelectItem>
                <SelectItem value="custom">טווח מותאם אישית</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">מתאריך</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="h-8 text-xs"
              placeholder="בחר תאריך התחלה"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">עד תאריך</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="h-8 text-xs"
              placeholder="בחר תאריך סיום"
            />
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
        
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={handleClearFilters} size="sm" className="h-7 text-xs px-3">
            נקה הכל
          </Button>
          <Button onClick={handleApplyFilters} size="sm" className="h-7 text-xs px-3">
            החל סינון
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
