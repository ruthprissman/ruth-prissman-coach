
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
    <Card className="mb-2 overflow-hidden shadow-sm">
      <CardContent className="p-2">
        <div className="flex flex-col lg:flex-row gap-2 min-h-[60px]">
          {/* סטטוס מידע */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-2 lg:w-1/3 rounded-md border border-purple-100">
            <div className="flex items-center mb-1">
              <CalendarIcon className="h-3.5 w-3.5 text-purple-600 ml-1" />
              <h3 className="text-xs font-medium text-purple-800">סנכרון יומן Google</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-1">
              <Badge variant={isGoogleAuthenticated ? "default" : "outline"} className="text-xs h-5 px-1.5">
                {isGoogleAuthenticated ? 'מחובר' : 'לא מחובר'}
              </Badge>
              
              {isGoogleAuthenticated && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {googleEvents.length} אירועים
                </Badge>
              )}
              
              {googleAuthError && (
                <div className="flex items-start mt-1 w-full">
                  <InfoIcon className="h-3 w-3 text-red-500 mt-0.5 ml-1 flex-shrink-0" />
                  <p className="text-xs text-red-500 leading-tight">{googleAuthError}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* כפתורים */}
          <div className="lg:w-2/3 flex flex-col justify-center">
            <div className="mb-1">
              <h3 className="text-xs font-medium text-gray-700 mb-0.5">פעולות יומן</h3>
              <p className="text-xs text-gray-500 leading-tight">
                {isGoogleAuthenticated 
                  ? 'סנכרן אירועים או העתק פגישות ליומן המערכת' 
                  : 'התחבר תחילה ליומן Google כדי לסנכרן אירועים'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
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
