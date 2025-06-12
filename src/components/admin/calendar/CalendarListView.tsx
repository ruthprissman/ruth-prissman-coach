
import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarSlot } from '@/types/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Calendar, Lock, CalendarPlus, Info, Monitor, Phone, User } from 'lucide-react';
import { getSessionTypeIcon, getSessionTypeIconColor } from '@/utils/sessionTypeIcons';
import { useSessionTypes } from '@/hooks/useSessionTypes';
import { cn } from '@/lib/utils';

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
  const { data: sessionTypes } = useSessionTypes();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-purple-600">טוען נתוני יומן...</div>
      </div>
    );
  }

  // Convert calendar data to a flat list
  const slotsList: CalendarSlot[] = [];
  calendarData.forEach((dayMap, date) => {
    dayMap.forEach((slot, hour) => {
      if (slot.status !== 'unspecified' || slot.isMeeting) {
        slotsList.push(slot);
      }
    });
  });

  // Sort by date and time
  slotsList.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.hour}`);
    const dateB = new Date(`${b.date} ${b.hour}`);
    return dateA.getTime() - dateB.getTime();
  });

  const getStatusIcon = (status: string, fromGoogle?: boolean) => {
    switch (status) {
      case 'available':
        return <Check className="h-4 w-4 text-purple-600" />;
      case 'private':
        return <Lock className="h-4 w-4 text-amber-600" />;
      case 'booked':
        return fromGoogle ? 
          <Calendar className="h-4 w-4 text-blue-600" /> : 
          <CalendarPlus className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string, fromGoogle?: boolean, fromFutureSession?: boolean) => {
    switch (status) {
      case 'available':
        return 'זמין';
      case 'private':
        return 'זמן פרטי';
      case 'booked':
        return fromGoogle ? 'אירוע ביומן גוגל' : fromFutureSession ? 'פגישה עתידית' : 'פגישה';
      case 'completed':
        return 'הושלם';
      case 'canceled':
        return 'בוטל';
      default:
        return 'לא מוגדר';
    }
  };

  const getMeetingTypeIcon = (type?: string) => {
    switch (type) {
      case 'Zoom':
        return <Monitor className="h-3 w-3 text-purple-600" />;
      case 'Phone':
        return <Phone className="h-3 w-3 text-purple-600" />;
      case 'In-Person':
        return <User className="h-3 w-3 text-purple-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 mb-4">
        סה"כ {slotsList.length} פריטים ברשימה
      </div>
      
      {slotsList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          אין פריטים להצגה בתצוגת רשימה
        </div>
      ) : (
        slotsList.map((slot, index) => {
          const sessionTypeId = slot.futureSession?.session_type_id || slot.googleEvent?.sessionTypeId;
          const sessionTypeIcon = getSessionTypeIcon(sessionTypeId, sessionTypes);
          const iconColorClass = getSessionTypeIconColor(sessionTypeId, sessionTypes);
          
          return (
            <div
              key={`${slot.date}-${slot.hour}-${index}`}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse relative">
                {/* Session type icon */}
                {sessionTypeIcon && (
                  <div className={cn(
                    'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold z-10',
                    iconColorClass
                  )}>
                    {sessionTypeIcon}
                  </div>
                )}
                
                {getStatusIcon(slot.status, slot.fromGoogle)}
                <div>
                  <div className="font-medium">
                    {format(new Date(slot.date), 'EEEE, dd/MM', { locale: he })} בשעה {slot.hour}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>{getStatusText(slot.status, slot.fromGoogle, slot.fromFutureSession)}</span>
                    {slot.futureSession?.meeting_type && (
                      <>
                        {getMeetingTypeIcon(slot.futureSession.meeting_type)}
                        <span className="text-xs">
                          {slot.futureSession.meeting_type === 'Zoom' ? 'זום' :
                           slot.futureSession.meeting_type === 'Phone' ? 'טלפון' : 'פגישה פרונטית'}
                        </span>
                      </>
                    )}
                  </div>
                  {slot.notes && (
                    <div className="text-xs text-gray-500 mt-1">{slot.notes}</div>
                  )}
                  {slot.description && (
                    <div className="text-xs text-gray-500 mt-1">{slot.description}</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Badge 
                  variant={slot.status === 'available' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {getStatusText(slot.status, slot.fromGoogle, slot.fromFutureSession)}
                </Badge>
                
                {slot.status === 'available' || slot.status === 'private' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newStatus = slot.status === 'available' ? 'private' : 
                                      slot.status === 'private' ? 'unspecified' : 'available';
                      onUpdateSlot(slot.date, slot.hour, newStatus);
                    }}
                    className="text-xs"
                  >
                    שנה סטטוס
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CalendarListView;
