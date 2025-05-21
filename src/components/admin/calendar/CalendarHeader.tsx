
import React from 'react';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { GoogleCalendarSync } from './GoogleCalendarSync';
import { GoogleCalendarEvent } from '@/types/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, RefreshCwIcon, InfoIcon } from 'lucide-react';

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
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* סטטוס מידע */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 md:w-1/3 border-b md:border-b-0 md:border-l border-gray-200">
            <div className="flex items-center mb-2">
              <CalendarIcon className="h-5 w-5 text-purple-600 ml-2" />
              <h3 className="text-lg font-medium text-purple-800">סנכרון יומן Google</h3>
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Badge variant={isGoogleAuthenticated ? "success" : "outline"} className="mr-0 ml-2">
                  {isGoogleAuthenticated ? 'מחובר' : 'לא מחובר'}
                </Badge>
                <span className="text-sm text-gray-600">סטטוס חיבור</span>
              </div>
              
              {isGoogleAuthenticated && (
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-0 ml-2">
                    {googleEvents.length}
                  </Badge>
                  <span className="text-sm text-gray-600">אירועים נטענו</span>
                </div>
              )}
              
              {googleAuthError && (
                <div className="flex items-start mt-2">
                  <InfoIcon className="h-4 w-4 text-red-500 mt-0.5 ml-1 flex-shrink-0" />
                  <p className="text-xs text-red-500">{googleAuthError}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* כפתורים */}
          <div className="p-6 md:w-2/3 flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-medium mb-2 text-gray-700">פעולות יומן</h3>
              <p className="text-sm text-gray-500">
                {isGoogleAuthenticated 
                  ? 'סנכרן אירועים או העתק פגישות מקצועיות ליומן המערכת' 
                  : 'התחבר תחילה ליומן Google כדי לסנכרן אירועים'}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-3">
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
