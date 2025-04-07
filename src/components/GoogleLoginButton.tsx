
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function GoogleLoginButton() {
  const { 
    isAuthenticated, 
    isAuthenticating,
    signIn,
    signOut,
    events,
    isLoadingEvents,
    fetchEvents,
    error 
  } = useGoogleOAuth();

  const handleClick = async () => {
    if (isAuthenticated) {
      console.log('🚪 GoogleLoginButton: Signing out from Google Calendar');
      signOut();
    } else {
      console.log('🔑 GoogleLoginButton: Starting Google sign-in process with calendar permissions');
      // The signIn function now triggers the OAuth flow that will redirect
      await signIn();
      // The rest of the flow is handled after redirect in main.tsx
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Button 
        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 mb-2"
        onClick={handleClick}
        disabled={isAuthenticating}
      >
        <Calendar className="h-4 w-4 text-blue-600" />
        <span>{isAuthenticated ? 'התנתק מיומן Google' : 'התחבר עם גוגל (כולל הרשאות יומן)'}</span>
        {isAuthenticating && (
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        )}
      </Button>
      
      {!isAuthenticated && error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>לא התקבלה הרשאה ליומן הגוגל שלך</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {isAuthenticated && (
        <div className="text-sm text-center mt-1 text-green-600">
          {isLoadingEvents ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>טוען אירועים...</span>
            </span>
          ) : (
            <span>{events.length > 0 ? `${events.length} אירועים נטענו מיומן Google` : 'אין אירועים ביומן'}</span>
          )}
        </div>
      )}
    </div>
  );
}
