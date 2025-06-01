
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('');
  const [paymentMethod, setPaymentMethod] = React.useState<string>('');
  const [client, setClient] = React.useState<string>('');
  const [dateError, setDateError] = React.useState<string>('');
  const [dateRange, setDateRange] = React.useState<string>('');

  // Fetch data from database
  const { data: patients = [] } = usePatients();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: categories = [] } = useFinanceCategories('income');

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
        paymentMethod: paymentMethod === 'all' ? undefined : paymentMethod,
        client: client === 'all' ? undefined : client
      });
    }
  }, [startDate, endDate, category, paymentMethod, client, onFiltersChange]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategory('');
    setPaymentMethod('');
    setClient('');
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
            <label className="text-xs text-muted-foreground">אמצעי תשלום</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-8 text-xs">
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
          
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-muted-foreground">לקוח</label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="h-8 text-xs">
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
