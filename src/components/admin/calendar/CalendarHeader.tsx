
import React from 'react';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { GoogleCalendarSync } from './GoogleCalendarSync';
import { GoogleCalendarEvent } from '@/types/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, InfoIcon } from 'lucide-react';

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
  onCopyProfessionalMeetings?: (selectedEventIds: string[], clientMapping: Record<string, number | null>) => Promise<any>;
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
    <Card className="mb-3 overflow-hidden shadow-sm">
      <CardContent className="p-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* סטטוס מידע */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 lg:w-1/3 rounded-md border border-purple-100">
            <div className="flex items-center mb-2">
              <CalendarIcon className="h-4 w-4 text-purple-600 ml-1.5" />
              <h3 className="text-sm font-medium text-purple-800">סנכרון יומן Google</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isGoogleAuthenticated ? "default" : "outline"} className="text-xs">
                {isGoogleAuthenticated ? 'מחובר' : 'לא מחובר'}
              </Badge>
              
              {isGoogleAuthenticated && (
                <Badge variant="secondary" className="text-xs">
                  {googleEvents.length} אירועים
                </Badge>
              )}
              
              {googleAuthError && (
                <div className="flex items-start mt-1 w-full">
                  <InfoIcon className="h-4 w-4 text-red-500 mt-0.5 ml-1 flex-shrink-0" />
                  <p className="text-xs text-red-500 leading-tight">{googleAuthError}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* כפתורים */}
          <div className="lg:w-2/3 flex flex-col justify-between">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-700 mb-1">פעולות יומן</h3>
              <p className="text-xs text-gray-500 leading-tight">
                {isGoogleAuthenticated 
                  ? 'סנכרן אירועים או העתק פגישות ליומן המערכת' 
                  : 'התחבר תחילה ליומן Google כדי לסנכרן אירועים'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
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
      </CardContent>
    </Card>
  );
}
