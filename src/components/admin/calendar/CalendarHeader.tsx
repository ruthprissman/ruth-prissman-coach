
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar as CalendarIcon, Settings, AlertCircle, RefreshCw } from 'lucide-react';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { Card } from '@/components/ui/card';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { GoogleAuthDebug } from '@/components/admin/GoogleAuthDebug';

interface CalendarHeaderProps {
  isSyncing: boolean;
  onGoogleSync: () => Promise<void>;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  isSyncing,
  onGoogleSync
}) => {
  const { 
    isAuthenticated,
    isAuthenticating,
    error: googleAuthError,
    events: googleEvents,
    signIn: onSignInGoogle,
    signOut: onSignOutGoogle,
  } = useGoogleAuth();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">ניהול זמינות יומן</h1>
        <div className="flex items-center gap-2">
          <GoogleOAuthButton 
            isAuthenticated={isAuthenticated}
            isAuthenticating={isAuthenticating}
            onSignIn={onSignInGoogle}
            onSignOut={onSignOutGoogle}
          />
          {isAuthenticated && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={onGoogleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>סנכרון ידני</span>
            </Button>
          )}
        </div>
      </div>

      {/* Debug component to display Google Auth state */}
      <GoogleAuthDebug />

      {googleAuthError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>שגיאה בהתחברות ליומן Google</AlertTitle>
          <AlertDescription>
            {googleAuthError}
          </AlertDescription>
        </Alert>
      )}

      {isAuthenticated && googleEvents.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <CalendarIcon className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-600">מצב יומן Google</AlertTitle>
          </div>
          <AlertDescription className="mt-2 text-sm">
            <p>מחובר ליומן Google. נטענו {googleEvents.length} אירועים.</p>
          </AlertDescription>
        </Alert>
      )}

      {!isAuthenticated && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>לא התקבלה גישה ליומן הגוגל שלך</AlertTitle>
          <AlertDescription>
            אנא התחבר לחשבון Google שלך וספק הרשאות גישה ליומן כדי להציג את האירועים שלך.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CalendarHeader;
