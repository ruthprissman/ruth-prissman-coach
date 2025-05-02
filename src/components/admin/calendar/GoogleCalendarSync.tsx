
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';

interface GoogleCalendarSyncProps {
  onSyncClick: () => void;
  isLoading: boolean;
  settingsError?: string | null;
}

export function GoogleCalendarSync({ onSyncClick, isLoading, settingsError }: GoogleCalendarSyncProps) {
  // Get debug info from context
  const { debugInfo } = useGoogleAuth();
  
  // Format last fetch time for display if available
  const lastFetchTime = debugInfo.lastEventFetch 
    ? new Date(debugInfo.lastEventFetch).toLocaleTimeString()
    : 'לא נטען';

  return (
    <div className="flex flex-col items-end gap-2">
      {settingsError && (
        <div className="text-sm text-red-500 mb-1">
          שגיאה בהגדרות יומן: {settingsError}
        </div>
      )}
      <div className="flex flex-col items-end gap-1">
        <div className="text-xs text-gray-500">
          סנכרון אחרון: {lastFetchTime}
        </div>
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
