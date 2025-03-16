
import React, { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { CalendarSlot, ContextMenuOptions } from '@/types/calendar';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Check, Calendar, X, Lock, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarGridProps {
  days: { date: string; label: string; dayNumber: number }[];
  hours: string[];
  calendarData: Map<string, Map<string, CalendarSlot>>;
  onUpdateSlot: (date: string, hour: string, status: 'available' | 'private' | 'unspecified') => void;
  isLoading: boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  days, 
  hours, 
  calendarData, 
  onUpdateSlot,
  isLoading 
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuOptions | null>(null);

  // Get status color and label (updated to match the requested design)
  const getStatusStyle = (status: string, syncStatus?: string, isGoogleEvent?: boolean) => {
    // Handle Google Calendar events
    if (isGoogleEvent) {
      return { bg: 'bg-[#FFDEE2]', border: 'border-red-300', text: 'text-red-800' }; // Light red for Google events
    }
    
    // Handle sync status first (highest priority)
    if (syncStatus === 'google-only') {
      return { bg: 'bg-[#FFDEE2]', border: 'border-red-300', text: 'text-red-800' }; // Light red for Google-only events
    }
    
    if (syncStatus === 'supabase-only') {
      return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' };
    }
    
    // Then handle regular status
    switch (status) {
      case 'available':
        return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' };
      case 'booked':
        return { bg: 'bg-[#5C4C8D]', border: 'border-[#5C4C8D]', text: 'text-[#CFB53B]' };
      case 'completed':
        return { bg: 'bg-gray-200', border: 'border-gray-300', text: 'text-gray-800' };
      case 'canceled':
        return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' };
      case 'private':
        return { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800' };
    }
  };

  // Handle right-click on a cell
  const handleContextMenu = (e: React.MouseEvent, date: string, hour: string, status: any) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      date,
      day: new Date(date).getDay(),
      hour,
      status
    });
  };

  // Handle selecting an option from the context menu
  const handleSelectOption = (status: 'available' | 'private' | 'unspecified') => {
    if (contextMenu) {
      onUpdateSlot(contextMenu.date, contextMenu.hour, status);
      setContextMenu(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table className="border rounded-md">
          <TableHeader className="bg-purple-50">
            <TableRow>
              <TableHead className="w-20 font-bold text-purple-800">שעה</TableHead>
              {days.map((day) => (
                <TableHead 
                  key={day.date} 
                  className="font-bold text-purple-800 text-center min-w-[120px]"
                >
                  {day.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {hours.map((hour) => (
              <TableRow key={hour} className="border-b">
                <TableCell className="font-medium bg-purple-50 text-purple-800">
                  {hour}
                </TableCell>
                {days.map((day) => {
                  const dayData = calendarData.get(day.date);
                  const slot = dayData?.get(hour);
                  const status = slot?.status || 'unspecified';
                  const syncStatus = slot?.syncStatus;
                  const isGoogleEvent = syncStatus === 'google-only' || slot?.fromGoogle;
                  const { bg, border, text } = getStatusStyle(status, syncStatus, isGoogleEvent);
                  
                  const slotContent = (
                    <TableCell 
                      className={`${bg} ${border} ${text} border text-center transition-colors cursor-pointer hover:opacity-80`}
                      onContextMenu={(e) => handleContextMenu(e, day.date, hour, status)}
                    >
                      {status === 'available' && <Check className="h-4 w-4 mx-auto text-purple-600" />}
                      {status === 'booked' && (
                        isGoogleEvent ? 
                          <span className="text-sm font-medium">תפוס</span> : 
                          <Calendar className="h-4 w-4 mx-auto text-[#CFB53B]" />
                      )}
                      {status === 'completed' && <Calendar className="h-4 w-4 mx-auto text-gray-600" />}
                      {status === 'canceled' && <Calendar className="h-4 w-4 mx-auto text-red-600" />}
                      {status === 'private' && <Lock className="h-4 w-4 mx-auto text-amber-600" />}
                      
                      {/* Add warning icon for mismatched slots */}
                      {(syncStatus === 'google-only' || syncStatus === 'supabase-only') && (
                        <AlertTriangle className="h-4 w-4 mx-auto mt-1 text-orange-600" />
                      )}
                      
                      {slot?.notes && <span className="text-xs mt-1 block truncate">{slot.notes}</span>}
                    </TableCell>
                  );
                  
                  return (
                    <ContextMenu key={`${day.date}-${hour}`}>
                      <ContextMenuTrigger asChild>
                        {slot?.description ? (
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
                      </ContextMenuTrigger>
                      <ContextMenuContent className="min-w-[160px]">
                        <ContextMenuItem 
                          className="flex items-center gap-2 text-purple-600"
                          onClick={() => handleSelectOption('available')}
                          disabled={status === 'booked' || isGoogleEvent}
                        >
                          <Check className="h-4 w-4" />
                          <span>הגדר כזמין</span>
                        </ContextMenuItem>
                        <ContextMenuItem 
                          className="flex items-center gap-2 text-amber-600"
                          onClick={() => handleSelectOption('private')}
                          disabled={status === 'booked' || isGoogleEvent}
                        >
                          <Lock className="h-4 w-4" />
                          <span>הגדר כזמן פרטי</span>
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          className="flex items-center gap-2 text-gray-600"
                          onClick={() => handleSelectOption('unspecified')}
                          disabled={status === 'booked' || isGoogleEvent}
                        >
                          <X className="h-4 w-4" />
                          <span>נקה סטטוס</span>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default CalendarGrid;
