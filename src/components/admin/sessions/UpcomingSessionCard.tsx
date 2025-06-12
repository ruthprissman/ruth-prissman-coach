
import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { FutureSession } from '@/types/session';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Monitor, Phone, User, 
  AlertTriangle, RefreshCw, History
} from 'lucide-react';
import { getSessionTypeIcon, getSessionTypeIconColor } from '@/utils/sessionTypeIcons';
import { useSessionTypes } from '@/hooks/useSessionTypes';
import { cn } from '@/lib/utils';

interface UpcomingSessionCardProps {
  session: FutureSession;
  isOverdue: boolean;
  onMoveToHistorical: (session: FutureSession) => void;
  onConvertSession: (session: FutureSession) => void;
}

const UpcomingSessionCard: React.FC<UpcomingSessionCardProps> = ({
  session,
  isOverdue,
  onMoveToHistorical,
  onConvertSession
}) => {
  const { data: sessionTypes } = useSessionTypes();

  // Format the date for display
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

  // Get session type icon and color
  const sessionTypeIcon = getSessionTypeIcon(session.session_type_id, sessionTypes);
  const iconColorClass = getSessionTypeIconColor(session.session_type_id, sessionTypes);

  return (
    <div 
      className={`p-3 rounded-md border ${isOverdue 
        ? 'bg-red-50 border-red-200' 
        : 'bg-purple-50 border-purple-200'}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col relative">
          {/* Session type icon */}
          {sessionTypeIcon && (
            <div className={cn(
              'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
              iconColorClass
            )}>
              {sessionTypeIcon}
            </div>
          )}
          
          <div className="flex items-center">
            {isOverdue && (
              <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />
            )}
            <div className="font-medium">
              {formatDate(session.session_date)}
            </div>
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            {getMeetingTypeIcon(session.meeting_type)}
            <span className="mr-1">{getMeetingTypeText(session.meeting_type)}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-purple-300 hover:bg-purple-50 text-purple-700"
            onClick={() => onMoveToHistorical(session)}
          >
            <History className="h-3 w-3 ml-1 text-purple-600" />
            העבר לפגישה היסטורית
          </Button>
          
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
    </div>
  );
};

export default UpcomingSessionCard;
