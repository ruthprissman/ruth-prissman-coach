
import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { AlertTriangle, Monitor, Phone, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FutureSession } from '@/types/session';

interface UpcomingSessionCardProps {
  session: FutureSession;
  isOverdue: boolean;
  onConvertSession: (session: FutureSession) => void;
}

const UpcomingSessionCard: React.FC<UpcomingSessionCardProps> = ({
  session,
  isOverdue,
  onConvertSession
}) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  // Get meeting type icon
  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'Zoom':
        return <Monitor className="h-4 w-4 text-purple-700" />;
      case 'Phone':
        return <Phone className="h-4 w-4 text-purple-700" />;
      case 'In-Person':
        return <User className="h-4 w-4 text-purple-700" />;
      default:
        return null;
    }
  };

  // Get meeting type text
  const getMeetingTypeText = (type: string) => {
    switch (type) {
      case 'Zoom':
        return 'זום';
      case 'Phone':
        return 'טלפון';
      case 'In-Person':
        return 'פגישה פרונטית';
      default:
        return type;
    }
  };

  return (
    <div 
      className={`p-3 rounded-md border ${isOverdue 
        ? 'bg-red-50 border-red-200' 
        : 'bg-purple-50 border-purple-200'}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center">
            {isOverdue && (
              <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />
            )}
            <div className="font-medium">
              {formatDate(session.start_time)}
            </div>
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            {getMeetingTypeIcon(session.meeting_type)}
            <span className="mr-1">{getMeetingTypeText(session.meeting_type)}</span>
          </div>
          {session.notes && (
            <div className="text-sm mt-2 text-gray-600">
              {session.notes}
            </div>
          )}
        </div>
        
        {isOverdue && (
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 hover:bg-amber-50 text-amber-700"
            onClick={() => onConvertSession(session)}
          >
            <RefreshCw className="h-3 w-3 ml-1 text-amber-600" />
            המר לפגישה שהושלמה
          </Button>
        )}
      </div>
    </div>
  );
};

export default UpcomingSessionCard;
