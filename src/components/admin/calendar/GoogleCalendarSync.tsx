
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface GoogleCalendarSyncProps {
  onSyncClick: () => void;
  isLoading: boolean;
  settingsError?: string | null;
}

export function GoogleCalendarSync({ onSyncClick, isLoading, settingsError }: GoogleCalendarSyncProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      {settingsError && (
        <div className="text-sm text-red-500 mb-1">
          שגיאה בהגדרות יומן: {settingsError}
        </div>
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
  );
}
