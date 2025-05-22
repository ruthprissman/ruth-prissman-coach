
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

export const IncomeFilters = () => {
  const [date, setDate] = React.useState<Date>();
  
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
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="כל הקטגוריות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              <SelectItem value="therapy">טיפולים</SelectItem>
              <SelectItem value="consultation">ייעוץ</SelectItem>
              <SelectItem value="workshop">סדנאות</SelectItem>
              <SelectItem value="other">אחר</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">אמצעי תשלום</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="כל אמצעי התשלום" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="credit">אשראי</SelectItem>
              <SelectItem value="transfer">העברה בנקאית</SelectItem>
              <SelectItem value="cash">מזומן</SelectItem>
              <SelectItem value="check">צ'ק</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-2">לקוח</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="כל הלקוחות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הלקוחות</SelectItem>
              <SelectItem value="123">ישראל ישראלי</SelectItem>
              <SelectItem value="124">יעל כהן</SelectItem>
              <SelectItem value="125">דוד לוי</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-full flex justify-end gap-2 mt-2">
          <Button variant="outline">נקה הכל</Button>
          <Button>החל סינון</Button>
        </div>
      </CardContent>
    </Card>
  );
};
