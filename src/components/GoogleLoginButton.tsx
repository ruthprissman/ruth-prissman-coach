
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2 } from 'lucide-react';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
      signOut();
    } else {
      console.log('[auth] Initiating Google sign-in from GoogleLoginButton');
      // This now uses the updated signIn function with calendar permissions
      const success = await signIn();
      if (success) {
        await fetchEvents();
      }
    }
  };

  return (
    <div className="flex flex-col">
      <Button 
        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-8 px-3 text-xs"
        onClick={handleClick}
        disabled={isAuthenticating}
        size="sm"
      >
        <Calendar className="h-3.5 w-3.5 text-blue-600" />
        <span>{isAuthenticated ? 'התנתק מיומן Google' : 'התחבר עם גוגל'}</span>
        {isAuthenticating && (
          <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" />
        )}
      </Button>
      
      {!isAuthenticated && error && (
        <Alert variant="destructive" className="mt-2 p-2">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-xs">שגיאה בהתחברות</AlertTitle>
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {isAuthenticated && (
        <div className="text-xs text-center mt-1 text-green-600">
          {isLoadingEvents ? (
            <span className="flex items-center gap-1 justify-center">
              <Loader2 className="h-3 w-3 animate-spin" />
              טוען אירועים...
            </span>
          ) : (
            <span>{events.length > 0 ? `${events.length} אירועים נטענו` : 'אין אירועים'}</span>
          )}
        </div>
      )}
    </div>
  );
}
