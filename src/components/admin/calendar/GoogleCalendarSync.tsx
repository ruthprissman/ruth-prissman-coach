
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar } from 'lucide-react';
import { CopyMeetingsDialog } from './CopyMeetingsDialog';
import { GoogleCalendarEvent } from '@/types/calendar';

interface GoogleCalendarSyncProps {
  onSyncClick: () => void;
  onCopyMeetingsClick?: (selectedEventIds: string[], clientMapping: Record<string, number | null>) => Promise<any>;
  isLoading: boolean;
  isCopying?: boolean;
  settingsError?: string | null;
  googleEvents?: GoogleCalendarEvent[];
}

export function GoogleCalendarSync({ 
  onSyncClick, 
  onCopyMeetingsClick, 
  isLoading, 
  isCopying = false,
  settingsError,
  googleEvents = []
}: GoogleCalendarSyncProps) {
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  
  const handleOpenCopyDialog = () => {
    setCopyDialogOpen(true);
  };
  
  return (
    <div className="flex flex-col items-end gap-2">
      {settingsError && (
        <div className="text-sm text-red-500 mb-1">
          שגיאה בהגדרות יומן: {settingsError}
        </div>
      )}
      <div className="flex gap-2">
        {onCopyMeetingsClick && (
          <>
            <Button 
              variant="outline" 
              className="flex items-center" 
              onClick={handleOpenCopyDialog}
              disabled={isLoading || isCopying || !!settingsError}
            >
              <Calendar className={`h-4 w-4 mr-2 ${isCopying ? 'animate-pulse' : ''}`} />
              <span>העתק פגישות מקצועיות מיומן Google</span>
            </Button>
            
            <CopyMeetingsDialog
              open={copyDialogOpen}
              onOpenChange={setCopyDialogOpen}
              googleEvents={googleEvents}
              onCopySelected={onCopyMeetingsClick}
              isLoading={isCopying}
            />
          </>
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
