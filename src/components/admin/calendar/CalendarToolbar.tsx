
import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ChevronRight, ChevronLeft, CalendarDays, PlusCircle, RefreshCw } from 'lucide-react';

interface CalendarToolbarProps {
  currentDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onAddRecurring: () => void;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onAddRecurring
}) => {
  // Format date range for display (e.g., "March 1 - March 7, 2023")
  const formatDateRange = () => {
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Sunday of current week
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // Saturday of current week
    
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${format(startDate, 'd')} - ${format(endDate, 'd MMMM yyyy')}`;
    } else {
      return `${format(startDate, 'd MMMM')} - ${format(endDate, 'd MMMM yyyy')}`;
    }
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 pb-4">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Button variant="outline" size="icon" onClick={onPrevWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNextWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="mr-2" onClick={onToday}>
          <CalendarDays className="h-4 w-4 mr-2" />
          <span>היום</span>
        </Button>
        <div className="font-medium">
          {formatDateRange()}
        </div>
      </div>
      
      <div className="flex space-x-2 rtl:space-x-reverse">
        <Button variant="outline" className="flex items-center" onClick={onAddRecurring}>
          <PlusCircle className="h-4 w-4 mr-2" />
          <span>הוסף זמינות חוזרת</span>
        </Button>
      </div>
    </div>
  );
};

export default CalendarToolbar;
