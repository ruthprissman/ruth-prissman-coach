import React from 'react';
import { CalendarSlot } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, isToday, isTomorrow, addDays, addMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Calendar, Clock, Check, X, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarListViewProps {
  calendarData: Map<string, Map<string, CalendarSlot>>;
  onUpdateSlot: (date: string, hour: string, status: 'available' | 'private' | 'unspecified') => void;
  isLoading: boolean;
}

const CalendarListView: React.FC<CalendarListViewProps> = ({ 
  calendarData, 
  onUpdateSlot,
  isLoading 
}) => {
  // Convert map to sorted array for displaying
  const getAllSlots = () => {
    const allSlots: CalendarSlot[] = [];
    
    calendarData.forEach((dayMap, date) => {
      dayMap.forEach((slot, hour) => {
        if (slot.status !== 'unspecified') {
          allSlots.push(slot);
        }
      });
    });
    
    // Sort by date and time
    return allSlots.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.hour.localeCompare(b.hour);
    });
  };
  
  const slots = getAllSlots();
  
  // Group slots by date
  const groupSlotsByDate = () => {
    const grouped = new Map<string, CalendarSlot[]>();
    
    slots.forEach(slot => {
      if (!grouped.has(slot.date)) {
        grouped.set(slot.date, []);
      }
      grouped.get(slot.date)?.push(slot);
    });
    
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };
  
  const groupedSlots = groupSlotsByDate();
  
  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return 'היום';
    } else if (isTomorrow(date)) {
      return 'מחר';
    } else if (date < addDays(new Date(), 7)) {
      return format(date, 'EEEE', { locale: require('date-fns/locale/he') });
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };
  
  // Get badge color and text for status
  const getStatusBadge = (status: string, fromGoogle?: boolean) => {
    // Handle Google Calendar events with specified colors
    if (fromGoogle || status === 'booked' && fromGoogle) {
      return { 
        variant: 'outline' as const, 
        color: 'text-[#CFB53B] border-[#5C4C8D] bg-[#5C4C8D]', 
        text: 'תפוס (Google)' 
      };
    }
    
    switch (status) {
      case 'available':
        return { variant: 'outline' as const, color: 'text-purple-600 border-purple-400 bg-purple-50', text: 'זמין' };
      case 'booked':
        return { variant: 'outline' as const, color: 'text-gray-600 border-gray-400 bg-gray-50', text: 'תפוס' };
      case 'completed':
        return { variant: 'outline' as const, color: 'text-gray-600 border-gray-400 bg-gray-50', text: 'הושלם' };
      case 'canceled':
        return { variant: 'outline' as const, color: 'text-red-600 border-red-400 bg-red-50', text: 'בוטל' };
      case 'private':
        return { variant: 'outline' as const, color: 'text-amber-600 border-amber-400 bg-amber-50', text: 'פרטי' };
      default:
        return { variant: 'outline' as const, color: 'text-gray-600', text: 'לא מוגדר' };
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  
  if (groupedSlots.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">אין משבצות זמן מוגדרות</h3>
        <p className="mb-4">השתמש בתצוגת הלוח כדי להגדיר זמינות</p>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {groupedSlots.map(([date, dateSlots]) => (
          <Card key={date} className="overflow-hidden border-purple-200">
            <div className="bg-purple-100 px-4 py-3 font-medium flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-700" />
                <span>{formatDateForDisplay(date)} ({format(new Date(date), 'dd/MM/yyyy')})</span>
              </div>
              <span className="text-sm text-purple-700">
                {dateSlots.filter(s => s.status === 'available').length} משבצות זמינות
              </span>
            </div>
            <CardContent className="p-0">
              <div className="divide-y">
                {dateSlots.map((slot, index) => {
                  const statusBadge = getStatusBadge(slot.status, slot.fromGoogle);
                  
                  // Calculate end time for each slot (90 minutes from hour)
                  const [hourStr, minutesStr] = slot.hour.split(':');
                  const slotStart = new Date();
                  slotStart.setHours(parseInt(hourStr, 10), parseInt(minutesStr || '0', 10), 0, 0);
                  const slotEnd = addMinutes(slotStart, 90);
                  const endTimeDisplay = format(slotEnd, 'HH:mm');
                  
                  const slotContent = (
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">{slot.hour} - {endTimeDisplay}</span>
                        {slot.notes && (
                          <span className="ml-2 text-sm text-gray-500">({slot.notes})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Badge variant={statusBadge.variant} className={statusBadge.color}>
                          {statusBadge.text}
                        </Badge>
                        
                        {slot.status !== 'booked' && (
                          <div className="flex space-x-1 rtl:space-x-reverse">
                            {slot.status !== 'available' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => onUpdateSlot(slot.date, slot.hour, 'available')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {slot.status !== 'private' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => onUpdateSlot(slot.date, slot.hour, 'private')}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                              onClick={() => onUpdateSlot(slot.date, slot.hour, 'unspecified')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  
                  return (
                    <div key={`${slot.date}-${slot.hour}-${index}`}>
                      {slot.description ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {slotContent}
                          </TooltipTrigger>
                          <TooltipContent 
                            side="bottom"
                            className="max-w-xs bg-gray-900 text-white p-2 text-xs rounded"
                          >
                            {slot.description}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        slotContent
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default CalendarListView;
