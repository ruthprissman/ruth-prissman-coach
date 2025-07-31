import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Trash2, Calendar as CalendarIcon, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { PublicationFormData, PublishLocationType } from '@/types/article';
import { formatInTimeZone } from 'date-fns-tz';

interface PublicationSettingsProps {
  publications: PublicationFormData[];
  onAdd: (publication: PublicationFormData) => void;
  onUpdate: (index: number, publication: PublicationFormData) => void;
  onDelete: (index: number) => void;
}

const PUBLISH_LOCATIONS: PublishLocationType[] = ['Website', 'Email', 'WhatsApp', 'Other'];

const PublicationSettings: React.FC<PublicationSettingsProps> = ({
  publications,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [newLocation, setNewLocation] = React.useState<PublishLocationType | ''>('');
  const [newScheduledDate, setNewScheduledDate] = React.useState<Date | null>(null);
  const [newScheduledTime, setNewScheduledTime] = React.useState<string>('09:00');
  const [error, setError] = React.useState<string | null>(null);

  const availableLocations = PUBLISH_LOCATIONS.filter(
    location => !publications.some(pub => pub.publish_location === location && !pub.isDeleted)
  );

  const handleAdd = () => {
    if (!newLocation) {
      setError('יש לבחור מיקום פרסום');
      return;
    }

    // Combine date and time into a single timestamp in Israel timezone
    let finalDate = null;
    if (newScheduledDate && newScheduledTime) {
      const [hours, minutes] = newScheduledTime.split(':').map(Number);
      const combinedDate = new Date(newScheduledDate);
      combinedDate.setHours(hours, minutes, 0, 0);
      finalDate = combinedDate;
    } else if (newScheduledDate) {
      // If only date is provided, use current time
      const now = new Date();
      const combinedDate = new Date(newScheduledDate);
      combinedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
      finalDate = combinedDate;
    }

    // Validate that the scheduled time is not in the past
    if (finalDate && finalDate < new Date()) {
      setError('לא ניתן לתזמן פרסום לזמן שכבר עבר');
      return;
    }

    onAdd({
      publish_location: newLocation as PublishLocationType,
      scheduled_date: finalDate,
      published_date: null
    });

    setNewLocation('');
    setNewScheduledDate(null);
    setNewScheduledTime('09:00');
    setError(null);
  };

  const handleDateChange = (index: number, date: Date | null) => {
    const publication = publications[index];
    let finalDate = date;
    
    // If we have both date and existing time, preserve the time
    if (date && publication.scheduled_date) {
      const existingDate = new Date(publication.scheduled_date);
      const newDate = new Date(date);
      newDate.setHours(existingDate.getHours(), existingDate.getMinutes(), 0, 0);
      finalDate = newDate;
    } else if (date) {
      // If only date is provided, use current time
      const now = new Date();
      finalDate = new Date(date);
      finalDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    }
    
    const updated = { ...publication, scheduled_date: finalDate };
    onUpdate(index, updated);
  };

  const handleTimeChange = (index: number, time: string) => {
    const publication = publications[index];
    let finalDate = null;
    
    if (publication.scheduled_date && time) {
      const [hours, minutes] = time.split(':').map(Number);
      finalDate = new Date(publication.scheduled_date);
      finalDate.setHours(hours, minutes, 0, 0);
    }
    
    const updated = { ...publication, scheduled_date: finalDate };
    onUpdate(index, updated);
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return <span>בחר תאריך ושעה</span>;
    return formatInTimeZone(date, 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm', { locale: he });
  };

  const extractTimeFromDate = (date: Date | null): string => {
    if (!date) return '09:00';
    return formatInTimeZone(date, 'Asia/Jerusalem', 'HH:mm');
  };

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="text-lg font-medium mb-2">הגדרות פרסום</h3>
      
      {publications.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מיקום פרסום</TableHead>
              <TableHead>תאריך ושעת פרסום מתוכנים</TableHead>
              <TableHead>תאריך פרסום בפועל</TableHead>
              <TableHead className="w-[100px]">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publications.filter(pub => !pub.isDeleted).map((publication, index) => (
              <TableRow key={index}>
                <TableCell>{publication.publish_location}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal flex-1",
                              !publication.scheduled_date && "text-muted-foreground"
                            )}
                          >
                            {publication.scheduled_date ? (
                              formatInTimeZone(publication.scheduled_date, 'Asia/Jerusalem', 'dd/MM/yyyy', { locale: he })
                            ) : (
                              <span>בחר תאריך</span>
                            )}
                            <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={publication.scheduled_date || undefined}
                            onSelect={(date) => handleDateChange(index, date)}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 opacity-50" />
                        <Input
                          type="time"
                          value={extractTimeFromDate(publication.scheduled_date)}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          className="w-20 text-sm"
                        />
                      </div>
                    </div>
                    
                    {publication.scheduled_date && (
                      <div className="text-xs text-gray-600">
                        {formatDateDisplay(publication.scheduled_date)}
                      </div>
                    )}
                    
                    {publication.scheduled_date && publication.scheduled_date < new Date() && (
                      <p className="text-yellow-600 text-xs">
                        ⚠️ זמן זה כבר עבר
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {publication.published_date 
                    ? formatInTimeZone(new Date(publication.published_date), 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm', { locale: he })
                    : 'טרם פורסם'}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                        <AlertDialogDescription>
                          פעולה זו תמחק את הפרסום המתוכנן.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(index)}>
                          מחק
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
          אין הגדרות פרסום. הוסף מיקומי פרסום למאמר.
        </div>
      )}

      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium mb-2">הוסף מיקום פרסום</h4>
        
        <div className="flex flex-wrap gap-4 items-start">
          <div className="w-full md:w-auto">
            <Select 
              value={newLocation} 
              onValueChange={(value) => setNewLocation(value as PublishLocationType)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="בחר מיקום פרסום" />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.length === 0 ? (
                  <div className="px-2 py-4 text-center text-muted-foreground">
                    כל מיקומי הפרסום כבר נבחרו
                  </div>
                ) : (
                  availableLocations.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
          </div>
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "pl-3 text-left font-normal flex-1",
                      !newScheduledDate && "text-muted-foreground"
                    )}
                  >
                    {newScheduledDate ? (
                      formatInTimeZone(newScheduledDate, 'Asia/Jerusalem', 'dd/MM/yyyy', { locale: he })
                    ) : (
                      <span>בחר תאריך</span>
                    )}
                    <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newScheduledDate}
                    onSelect={setNewScheduledDate}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 opacity-50" />
                <Input
                  type="time"
                  value={newScheduledTime}
                  onChange={(e) => setNewScheduledTime(e.target.value)}
                  className="w-20 text-sm"
                />
              </div>
            </div>
            
            {newScheduledDate && newScheduledTime && (
              <div className="text-xs text-gray-600">
                יתקיים ב: {formatInTimeZone(
                  (() => {
                    const [hours, minutes] = newScheduledTime.split(':').map(Number);
                    const date = new Date(newScheduledDate);
                    date.setHours(hours, minutes, 0, 0);
                    return date;
                  })(),
                  'Asia/Jerusalem',
                  'dd/MM/yyyy HH:mm',
                  { locale: he }
                )}
              </div>
            )}
            
            {error && (
              <p className="text-destructive text-xs">
                {error}
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleAdd} 
            disabled={!newLocation || availableLocations.length === 0}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            הוסף
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicationSettings;
