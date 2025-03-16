
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface GoogleCalendarSyncProps {
  onSyncClick: () => void;
  isLoading: boolean;
}

export function GoogleCalendarSync({ onSyncClick, isLoading }: GoogleCalendarSyncProps) {
  return (
    <Button 
      variant="outline" 
      className="flex items-center" 
      onClick={onSyncClick}
      disabled={isLoading}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      <span>סנכרן עם Google Calendar</span>
    </Button>
  );
}
