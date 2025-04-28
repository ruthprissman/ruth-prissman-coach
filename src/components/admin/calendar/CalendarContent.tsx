
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalendarToolbar from './CalendarToolbar';
import CalendarGrid from './CalendarGrid';
import CalendarListView from './CalendarListView';
import { CalendarSlot } from '@/types/calendar';
import { GoogleCalendarEventForm } from './GoogleCalendarEventForm';

interface CalendarContentProps {
  days: { date: string; label: string; dayNumber: number }[];
  hours: string[];
  currentDate: Date;
  calendarData: Map<string, Map<string, CalendarSlot>>;
  isLoading: boolean;
  onNavigateWeek: (direction: 'next' | 'prev') => void;
  onUpdateSlot: (date: string, hour: string, status: 'available' | 'private' | 'unspecified') => void;
  onSetCurrentDate: (date: Date) => void;
  onRecurringDialogOpen: () => void;
}

const CalendarContent: React.FC<CalendarContentProps> = ({
  days,
  hours,
  currentDate,
  calendarData,
  isLoading,
  onNavigateWeek,
  onUpdateSlot,
  onSetCurrentDate,
  onRecurringDialogOpen
}) => {
  const [selectedView, setSelectedView] = useState<'calendar' | 'list'>('calendar');

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-9">
        <Card className="h-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>הגדרת זמני זמינות לפגישות</CardTitle>
              <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'calendar' | 'list')}>
                <TabsList>
                  <TabsTrigger value="calendar">תצוגת לוח</TabsTrigger>
                  <TabsTrigger value="list">תצוגת רשימה</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarToolbar 
              currentDate={currentDate}
              onPrevWeek={() => onNavigateWeek('prev')}
              onNextWeek={() => onNavigateWeek('next')}
              onToday={() => onSetCurrentDate(new Date())}
              onAddRecurring={onRecurringDialogOpen}
            />
            
            <div className="mt-4">
              {selectedView === 'calendar' ? (
                <CalendarGrid 
                  days={days}
                  hours={hours}
                  calendarData={calendarData}
                  onUpdateSlot={onUpdateSlot}
                  isLoading={isLoading}
                />
              ) : (
                <CalendarListView 
                  calendarData={calendarData}
                  onUpdateSlot={onUpdateSlot}
                  isLoading={isLoading}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="col-span-3">
        <GoogleCalendarEventForm />
      </div>
    </div>
  );
};

export default CalendarContent;
