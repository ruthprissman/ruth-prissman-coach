
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
    <div className="flex items-center gap-1.5">
      <button 
        className="bg-white border border-input hover:bg-accent hover:text-accent-foreground flex items-center gap-1 h-7 px-2 text-xs min-h-0 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" 
        onClick={onSyncClick}
        disabled={isLoading || !!settingsError}
      >
        <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        <span>סנכרן יומן</span>
      </button>

      {onCopyMeetingsClick && (
        <>
          <button 
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1 h-7 px-2 text-xs min-h-0 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" 
            onClick={handleOpenCopyDialog}
            disabled={isLoading || isCopying || !!settingsError}
          >
            <Calendar className={`h-3 w-3 ${isCopying ? 'animate-pulse' : ''}`} />
            <span>העתק פגישות</span>
          </button>
          
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
