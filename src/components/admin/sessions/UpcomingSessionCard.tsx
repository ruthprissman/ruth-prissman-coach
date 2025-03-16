
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FutureSession } from '@/types/session';
import { Patient } from '@/types/patient';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { Video, Phone, User, Calendar, Clock, X, MoreHorizontal } from 'lucide-react';
import DeleteSessionDialog from './DeleteSessionDialog';
import { formatDateInIsraelTimeZone, calculateSessionEndTime } from '@/utils/dateUtils';

interface UpcomingSessionCardProps {
  session: FutureSession;
  patient?: Patient | null;
  onDelete?: () => void;
  onEdit?: () => void;
  onConvert?: () => void;
  showControls?: boolean;
  showPatientLink?: boolean;
}

export const getStatusClass = (session: FutureSession) => {
  if (!session.session_date) return 'bg-gray-50';
  
  const sessionDate = new Date(session.session_date);
  
  if (isPast(sessionDate) && !isToday(sessionDate)) {
    return 'bg-red-50 border-red-300';
  } else if (isToday(sessionDate)) {
    return 'bg-blue-50 border-blue-300';
  } else if (isFuture(sessionDate)) {
    return 'bg-green-50 border-green-300';
  }
  return 'bg-gray-50';
};

const SessionTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Zoom':
      return <Video className="h-4 w-4 text-blue-600" />;
    case 'Phone':
      return <Phone className="h-4 w-4 text-green-600" />;
    case 'In-Person':
      return <User className="h-4 w-4 text-purple-600" />;
    default:
      return null;
  }
};

const UpcomingSessionCard: React.FC<UpcomingSessionCardProps> = ({
  session,
  patient,
  onDelete,
  onEdit,
  onConvert,
  showControls = true,
  showPatientLink = true
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Format session date using Israel timezone
  const formattedDate = formatDateInIsraelTimeZone(session.session_date, 'PPP');
  const formattedTime = formatDateInIsraelTimeZone(session.session_date, 'HH:mm');
  const endTime = calculateSessionEndTime(session.session_date);
  
  // Get the CSS class based on session status
  const statusClass = getStatusClass(session);

  return (
    <Card className={`p-4 border shadow-sm ${statusClass}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{formattedDate}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{formattedTime} - {endTime}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <SessionTypeIcon type={session.meeting_type} />
            <span className="text-sm">{session.meeting_type}</span>
          </div>
          
          {patient && (
            <div className="mt-3 text-sm font-medium">
              {showPatientLink ? (
                <a
                  href={`/admin/clients/${patient.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {patient.name}
                </a>
              ) : (
                <span>{patient.name}</span>
              )}
            </div>
          )}
          
          {session.notes && (
            <div className="mt-1 text-sm text-gray-500">{session.notes}</div>
          )}
        </div>
        
        {showControls && (
          <div className="flex flex-col gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {onConvert && (
        <div className="mt-3 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={onConvert} className="w-full">
            המר לפגישה
          </Button>
        </div>
      )}
      
      {onDelete && (
        <DeleteSessionDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          session={session}
          onConfirm={onDelete}
          formatDate={formatDateInIsraelTimeZone}
        />
      )}
    </Card>
  );
};

export default UpcomingSessionCard;
