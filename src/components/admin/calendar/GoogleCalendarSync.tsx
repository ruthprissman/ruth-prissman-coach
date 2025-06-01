
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
    <div className="flex items-stretch gap-1.5 h-7">
      <Button
        variant="outline"
        className="!h-7 !min-h-[28px] !max-h-[28px] px-2 text-xs gap-1 flex-shrink-0"
        onClick={onSyncClick}
        disabled={isLoading || !!settingsError}
      >
        <RefreshCw className={`h-3 w-3 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
        <span className="truncate">סנכרן יומן</span>
      </Button>

      {onCopyMeetingsClick && (
        <>
          <Button
            variant="secondary"
            className="!h-7 !min-h-[28px] !max-h-[28px] px-2 text-xs gap-1 flex-shrink-0"
            onClick={handleOpenCopyDialog}
            disabled={isLoading || isCopying || !!settingsError}
          >
            <Calendar className={`h-3 w-3 flex-shrink-0 ${isCopying ? 'animate-pulse' : ''}`} />
            <span className="truncate">העתק פגישות</span>
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
    </div>
  );
}
