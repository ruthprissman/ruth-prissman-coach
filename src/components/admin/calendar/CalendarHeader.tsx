
import React from 'react';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { GoogleCalendarSync } from './GoogleCalendarSync';
import { GoogleCalendarEvent } from '@/types/calendar';

interface CalendarHeaderProps {
  isGoogleAuthenticated: boolean;
  isGoogleAuthenticating: boolean;
  googleAuthError: string | null;
  googleEvents: GoogleCalendarEvent[];
  isSyncing: boolean;
  isCopyingMeetings?: boolean;
  isLoadingGoogleEvents: boolean;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onGoogleSync: () => Promise<void>;
  onCopyProfessionalMeetings?: (selectedEventIds: string[], clientMapping: Record<string, number | null>) => Promise<void>;
}

export default function CalendarHeader({
  isGoogleAuthenticated,
  isGoogleAuthenticating,
  googleAuthError,
  googleEvents,
  isSyncing,
  isCopyingMeetings = false,
  isLoadingGoogleEvents,
  onSignInGoogle,
  onSignOutGoogle,
  onGoogleSync,
  onCopyProfessionalMeetings
}: CalendarHeaderProps) {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">סנכרון יומן Google</h3>
          <p className="text-sm text-gray-500">
            {isGoogleAuthenticated 
              ? `${googleEvents.length} אירועים טעונים מיומן Google` 
              : 'התחבר ליומן Google כדי לסנכרן אירועים'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <GoogleLoginButton />
          
          {isGoogleAuthenticated && (
            <GoogleCalendarSync 
              onSyncClick={onGoogleSync} 
              onCopyMeetingsClick={onCopyProfessionalMeetings}
              isLoading={isSyncing || isLoadingGoogleEvents} 
              isCopying={isCopyingMeetings}
              settingsError={googleAuthError}
              googleEvents={googleEvents}
            />
          )}
        </div>
      </div>
    </div>
  );
}
