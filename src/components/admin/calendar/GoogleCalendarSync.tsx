
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar } from 'lucide-react';

interface GoogleCalendarSyncProps {
  onSyncClick: () => void;
  onCopyMeetingsClick?: () => void;
  isLoading: boolean;
  isCopying?: boolean;
  settingsError?: string | null;
}

export function GoogleCalendarSync({ 
  onSyncClick, 
  onCopyMeetingsClick, 
  isLoading, 
  isCopying = false,
  settingsError 
}: GoogleCalendarSyncProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      {settingsError && (
        <div className="text-sm text-red-500 mb-1">
          שגיאה בהגדרות יומן: {settingsError}
        </div>
      )}
      <div className="flex gap-2">
        {onCopyMeetingsClick && (
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={onCopyMeetingsClick}
            disabled={isLoading || isCopying || !!settingsError}
          >
            <Calendar className={`h-4 w-4 mr-2 ${isCopying ? 'animate-pulse' : ''}`} />
            <span>העתק פגישות מקצועיות מיומן Google</span>
          </Button>
        )}
        
        <Button 
          variant="outline" 
          className="flex items-center" 
          onClick={onSyncClick}
          disabled={isLoading || !!settingsError}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          <span>סנכרן עם Google Calendar</span>
        </Button>
      </div>
    </div>
  );
}
