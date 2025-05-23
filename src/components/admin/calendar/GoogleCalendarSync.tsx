
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
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm"
        className="bg-white flex items-center gap-1 h-8 px-2.5" 
        onClick={onSyncClick}
        disabled={isLoading || !!settingsError}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        <span className="text-xs">סנכרן יומן</span>
      </Button>

      {onCopyMeetingsClick && (
        <>
          <Button 
            variant="secondary"
            size="sm"
            className="flex items-center gap-1 h-8 px-2.5" 
            onClick={handleOpenCopyDialog}
            disabled={isLoading || isCopying || !!settingsError}
          >
            <Calendar className={`h-3.5 w-3.5 ${isCopying ? 'animate-pulse' : ''}`} />
            <span className="text-xs">העתק פגישות</span>
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
